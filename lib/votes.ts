import { createClient } from 'redis';

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
 * Get or create Redis client
 */
let redisClient: Awaited<ReturnType<typeof createClient>> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Reads all votes from Redis storage
 * 
 * @returns Promise resolving to parsed vote records
 */
async function readVotes(): Promise<VoteRecord[]> {
  try {
    const redis = await getRedisClient();
    const votesJson = await redis.get('votes');
    
    if (!votesJson) {
      return [];
    }
    
    const votes = JSON.parse(votesJson) as VoteRecord[];
    return votes;
  } catch (error) {
    console.error('Error reading votes from Redis:', error);
    return [];
  }
}

/**
 * Gets vote statistics from Redis storage
 * 
 * @returns Promise resolving to vote statistics
 */
export async function getVoteStats(): Promise<VoteStats> {
  const votes = await readVotes();
  
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
 * Appends a new vote record to Redis storage
 * 
 * @param email - The email address that was used to vote
 * @returns Promise resolving to success/failure
 */
export async function saveVote(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const timestamp = new Date().toISOString();
    const voteDate = timestamp.split('T')[0];
    
    // Create new vote record
    const newVote: VoteRecord = {
      email,
      timestamp,
      vote_date: voteDate,
    };
    
    // Get existing votes
    const existingVotes = await readVotes();
    
    // Add new vote to the beginning (most recent first)
    const updatedVotes = [newVote, ...existingVotes];
    
    // Save back to Redis
    const redis = await getRedisClient();
    await redis.set('votes', JSON.stringify(updatedVotes));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving vote to Redis:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

