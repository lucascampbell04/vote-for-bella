import { NextResponse } from "next/server";
import { createTempEmail } from "@/app/actions/createEmailAddress";
import { deleteEmailAddress } from "@/app/actions/deleteEmailAddress";
import { getFirstEmailContent } from "@/app/actions/getFirstEmailContent";
import { saveVote } from "@/lib/votes";
import chromium from "@sparticuz/chromium";
import puppeteer, { Page } from "puppeteer-core";

// Delay between server action calls (in milliseconds)
const DELETE_DELAY_MS = Number(process.env.DELETE_DELAY_MS) || 1100; // Default: 1.1 seconds

/**
 * POST /api/vote
 * 1. Creates a new temporary email address
 * 2. Waits 1.1 seconds (configurable via DELETE_DELAY_MS)
 * 3. Opens https://vip.covergirl.maxim.com/model/l0PBK in Puppeteer (headless: true)
 * 4. Waits for vote button with text "Vote for isabellampaul" to appear
 * 5. Clicks the vote button
 * 6. Fills in email (types 1st char, waits for DOM re-render, re-selects input, types rest)
 * 7. Fills in password (types 1st char, waits for DOM re-render, re-selects input, types rest)
 * 8. Clicks the checkbox
 * 9. Clicks the "Sign up" button
 * 10. Waits for email to arrive and fetches the verification code (retries up to 10 times)
 * 11. Logs the email content
 * 12. Extracts the 6-digit verification code from the email
 * 13. Types the code into the OTP input field
 * 14. Clicks the "Verify" button
 * 15. Waits for URL to contain "voteStatus=success"
 * 16. Saves the vote to votes.csv
 * 17. Closes the browser
 * 18. Returns success response with email address
 */
export async function POST() {
  try {
    // Call server action: Create a new temporary email address
    const result = await createTempEmail();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Wait for the configured delay
    await new Promise((resolve) => setTimeout(resolve, DELETE_DELAY_MS));

    const executablePath = await chromium.executablePath();

    // Open the page in Puppeteer (headless: false to see the browser)
    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: null,
        executablePath,
        headless: true,
      });
      const page = await browser.newPage();
      await page.goto("https://vip.covergirl.maxim.com/model/l0PBK", {
        waitUntil: "networkidle2",
      });

      // Wait for the vote button to appear and verify text
      console.log("Waiting for vote button...");
      const voteButton = await page.waitForSelector("button.bg-maximRed", {
        timeout: 10000,
      });

      if (!voteButton) {
        throw new Error("Vote button not found");
      }

      // Verify button text contains 'Vote for isabellampaul'
      const buttonText = await page.evaluate(
        (el) => el?.textContent || "",
        voteButton
      );
      console.log("Button text:", buttonText);

      if (buttonText.includes("Vote for isabellampaul")) {
        console.log("Vote button found with correct text, clicking...");
        await voteButton.click();
        console.log("Vote button clicked!");

        // Wait for email input to appear
        console.log("Waiting for email input...");
        const emailInput = await page.waitForSelector(
          'input[name="emailAddress"][type="email"]',
          {
            timeout: 10000,
          }
        );

        if (!emailInput) {
          throw new Error("Email input not found");
        }

        // Fill in the email address
        console.log("Filling in email:", result.email_address);
        // Type first character (this will cause unfocus and DOM re-render)
        await emailInput.type(result.email_address.charAt(0));
        // Wait a bit for unfocus and re-render to happen
        await new Promise((resolve) => setTimeout(resolve, 200));
        // Re-select the email input (old reference is detached)
        const emailInputRefocused = await page.waitForSelector(
          'input[name="emailAddress"][type="email"]',
          {
            timeout: 5000,
          }
        );
        if (!emailInputRefocused) {
          throw new Error("Email input not found after re-render");
        }
        // Click to refocus
        await emailInputRefocused.click();
        // Type the rest
        await emailInputRefocused.type(result.email_address.slice(1));
        console.log("Email filled");

        // Wait for password input
        await page.waitForSelector('input[name="password"][type="password"]', {
          timeout: 5000,
        });

        const randomString = Math.random().toString(36).slice(2, 10);
        const randomPassword = `Pass${randomString}123!`;

        await trulyType(page, 'input[name="password"][type="password"]', randomPassword);
        console.log("Password typed fully via key events");

        // Click the checkbox
        console.log("Waiting for checkbox...");
        const checkbox = await page.waitForSelector('button[role="checkbox"]', {
          timeout: 5000,
        });

        if (!checkbox) {
          throw new Error("Checkbox not found");
        }

        console.log("Clicking checkbox...");
        await checkbox.click();

        // Click the sign up button
        console.log("Waiting for sign up button...");
        const signUpButton = await page.waitForSelector(
          'button[data-original-text="Sign up"]',
          {
            timeout: 5000,
          }
        );

        if (!signUpButton) {
          throw new Error("Sign up button not found");
        }

        console.log("Clicking sign up button...");
        await signUpButton.click();
        console.log("Sign up button clicked!");

        // Wait for the email to arrive and fetch it
        console.log("Waiting for email to arrive...");
        let emailContent = null;
        const maxRetries = 10;
        const retryDelay = 2000; // 2 seconds between retries

        for (let i = 0; i < maxRetries; i++) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          
          const emailResult = await getFirstEmailContent(result.email_address);
          
          if (emailResult.success && emailResult.content) {
            emailContent = emailResult.content;
            console.log("=== EMAIL RECEIVED ===");
            console.log("Subject:", emailResult.subject);
            console.log("From:", emailResult.from);
            console.log("Content:", emailResult.content);
            console.log("=== END EMAIL ===");
            
            // Extract the verification code from the email
            const codeMatch = emailResult.content.match(/YOUR CODE (\d{6})/);
            if (codeMatch && codeMatch[1]) {
              const verificationCode = codeMatch[1];
              console.log("Extracted verification code:", verificationCode);
              
              // Wait for the OTP input field
              console.log("Waiting for OTP input field...");
              const otpInput = await page.waitForSelector(
                'input[data-input-otp="true"]',
                { timeout: 10000 }
              );
              
              if (otpInput) {
                console.log("Typing verification code...");
                await otpInput.click();
                await otpInput.type(verificationCode);
                console.log("Verification code entered!");
                
                // Wait for and click the Verify button
                console.log("Waiting for Verify button...");
                const verifyButton = await page.waitForSelector(
                  'button[data-original-text="Verify"]',
                  { timeout: 5000 }
                );
                
                if (verifyButton) {
                  console.log("Clicking Verify button...");
                  await verifyButton.click();
                  console.log("Verify button clicked!");
                  
                  // Wait for URL to contain voteStatus=success
                  console.log("Waiting for vote success...");
                  try {
                    await page.waitForFunction(
                      () => window.location.href.includes('voteStatus=success'),
                      { timeout: 30000 }
                    );
                    console.log("Vote successful! URL contains voteStatus=success");
                    
                    // Save vote to CSV
                    console.log("Saving vote to CSV...");
                    const saveResult = await saveVote(result.email_address);
                    if (saveResult.success) {
                      console.log("Vote saved to CSV successfully!");
                    } else {
                      console.error("Failed to save vote to CSV:", saveResult.error);
                    }
                    
                    // Close the browser
                    console.log("Closing browser...");
                    await browser.close();
                    console.log("Browser closed!");
                    
                    // Return success response
                    return NextResponse.json({
                      success: true,
                      message: `Vote cast successfully as ${result.email_address}`,
                      email_address: result.email_address,
                    });
                  } catch (waitError) {
                    console.error("Timeout waiting for vote success:", waitError);
                  }
                } else {
                  console.error("Verify button not found");
                }
              } else {
                console.error("OTP input field not found");
              }
            } else {
              console.error("Could not extract verification code from email");
            }
            
            break;
          } else if (!emailResult.success) {
            console.error("Error fetching email:", emailResult.error);
          } else {
            console.log(`Attempt ${i + 1}/${maxRetries}: No email yet, retrying...`);
          }
        }

        if (!emailContent) {
          console.error("Failed to receive email after", maxRetries, "attempts");
        }
      } else {
        console.error(
          'Button text does not match. Expected "Vote for isabellampaul", got:',
          buttonText
        );
      }

    } catch (puppeteerError) {
      console.error("Puppeteer error:", puppeteerError);
      if (browser) {
        await browser.close();
      }
      return NextResponse.json(
        { error: "Puppeteer automation failed", details: puppeteerError },
        { status: 500 }
      );
    }

    // If we get here, something went wrong (vote didn't complete)
    if (browser) {
      await browser.close();
    }

    // Call server action: Delete the email after opening the page
    const deleteResult = await deleteEmailAddress(result.email_address);

    if (!deleteResult.success) {
      console.error("Failed to delete email:", deleteResult.error);
    }
    
    return NextResponse.json(
      { error: "Vote process did not complete successfully" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in /api/vote:", error);
    return NextResponse.json(
      { error: "Failed to create email address" },
      { status: 500 }
    );
  }
}

// Robust React-safe typing helper
async function trulyType(page: Page, selector: string, text: string, delay: number = 80) {
  for (const ch of text) {
    const el = await page.waitForSelector(selector, { visible: true });
    await el?.focus();
    await page.keyboard.type(ch, { delay });
    await new Promise((resolve) => setTimeout(resolve, 30)); // tiny pause lets React process onChange
  }
}