import { getVoteStats } from '@/lib/votes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoteButton } from '@/components/vote-button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const stats = await getVoteStats();

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col space-y-8 overflow-hidden">
        {/* Header */}
        <div className="text-center space-y-4 flex-shrink-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Vote For Bella</h1>
            <p className="text-muted-foreground">Track all votes and email activity</p>
          </div>
          <VoteButton />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">All time votes casted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Created</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmailsCreated}</div>
              <p className="text-xs text-muted-foreground">Unique email addresses used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes Today</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.votesToday}</div>
              <p className="text-xs text-muted-foreground">Votes casted today</p>
            </CardContent>
          </Card>
        </div>

        {/* Votes Table */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle>All Votes</CardTitle>
            <CardDescription>Complete list of all emails that voted for Bella</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Vote Date</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.allVotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No votes recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats.allVotes.map((vote, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{vote.email}</TableCell>
                        <TableCell>{vote.vote_date}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(vote.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={vote.vote_date === new Date().toISOString().split('T')[0] ? 'default' : 'secondary'}>
                            {vote.vote_date === new Date().toISOString().split('T')[0] ? 'Today' : 'Past'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
