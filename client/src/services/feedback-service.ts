import { toast } from '@/hooks/use-toast';

/**
 * Service for providing user feedback and notifications
 */
export const FeedbackService = {
  /**
   * Display a success message when a team is created
   */
  teamCreated: (teamName: string) => {
    toast({
      title: 'Team aangemaakt',
      description: `"${teamName}" is succesvol aangemaakt. Je kunt nu leden uitnodigen.`,
      variant: 'default',
    });
  },

  /**
   * Display a success message when a team invite link is copied
   */
  teamInviteCopied: () => {
    toast({
      title: 'Link gekopieerd',
      description: 'Uitnodigingslink is gekopieerd naar het klembord',
      variant: 'default',
    });
  },

  /**
   * Display an error message
   */
  error: (title: string, message?: string) => {
    toast({
      title: title || 'Er is een fout opgetreden',
      description: message,
      variant: 'destructive',
    });
  },

  /**
   * Display a success message
   */
  success: (title: string, message: string) => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  },

  /**
   * Display an info message
   */
  info: (title: string, message: string) => {
    toast({
      title,
      description: message,
    });
  },
};