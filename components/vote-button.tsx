'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function VoteButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to cast vote: ${data.error}`);
        return;
      }

      // Show success toast with the message from the server
      if (data.message) {
        toast.success(data.message);
      } else {
        toast.success(`Vote cast successfully as ${data.email_address}`);
      }

    } catch (error) {
      console.error('Vote error:', error);
      toast.error(`Failed to create email: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleVote} 
      disabled={isLoading}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Casting vote...
        </>
      ) : (
        'Cast vote'
      )}
    </Button>
  );
}

