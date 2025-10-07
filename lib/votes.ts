import { promises as fs } from 'fs';
import path from 'path';

/**
 * Vote record structure
 */
export interface VoteRecord {
  email: string;
  timestamp: string;
  vote_date: string;
}

/**
 * Statistics about votes
 */
export interface VoteStats {
  totalVotes: number;
  totalEmailsCreated: number;
  votesToday: number;
  allVotes: VoteRecord[];
}

/**
 * Reads and parses the votes CSV file
 * 
 * @returns Promise resolving to parsed vote records
 */
async function readVotesCSV(): Promise<VoteRecord[]> {
  try {
    const csvPath = path.join(process.cwd(), 'votes.csv');
    const fileContents = await fs.readFile(csvPath, 'utf-8');
    
    const lines = fileContents.trim().split('\n');
    const headers = lines[0].split(',');
    
    const votes: VoteRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        votes.push({
          email: values[0].trim(),
          timestamp: values[1].trim(),
          vote_date: values[2].trim(),
        });
      }
    }
    
    return votes;
  } catch (error) {
    console.error('Error reading votes CSV:', error);
    return [];
  }
}

/**
 * Gets vote statistics from the CSV file
 * 
 * @returns Promise resolving to vote statistics
 */
export async function getVoteStats(): Promise<VoteStats> {
  const votes = await readVotesCSV();
  
  // Get unique emails
  const uniqueEmails = new Set(votes.map(v => v.email));
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Count votes today
  const votesToday = votes.filter(v => v.vote_date === today).length;
  
  return {
    totalVotes: votes.length,
    totalEmailsCreated: uniqueEmails.size,
    votesToday,
    allVotes: votes,
  };
}

/**
 * Appends a new vote record to the CSV file
 * 
 * @param email - The email address that was used to vote
 * @returns Promise resolving to success/failure
 */
export async function saveVote(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const csvPath = path.join(process.cwd(), 'votes.csv');
    const timestamp = new Date().toISOString();
    const voteDate = timestamp.split('T')[0];
    
    // Create CSV row
    const row = `${email},${timestamp},${voteDate}\n`;
    
    // Append to file
    await fs.appendFile(csvPath, row, 'utf-8');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving vote to CSV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

