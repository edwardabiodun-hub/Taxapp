import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Building2, ChevronRight, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { signOut } from "@/lib/auth";
import { requestAccountDeletion } from "@/lib/account-deletion";
import { toast } from "@/hooks/use-toast";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const result = await requestAccountDeletion();

      if (result.declarationsFailed.length > 0) {
        toast({
          title: "Deletion partially completed",
          description: `${result.declarationsFailed.length} declaration(s) couldn't be reached — check your connection and try again.`,
          variant: "destructive",
        });
        return;
      }

      const retainedNote =
        result.declarationsRetained.length > 0
          ? ` ${result.declarationsRetained.length} tax record(s) are being kept as required by law until their retention period ends.`
          : "";
      toast({
        title: "Account deleted",
        description: `Your personal details have been removed.${retainedNote}`,
      });
      navigate("/onboarding");
    } catch {
      toast({
        title: "Couldn't delete your account",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-card divide-y divide-border">
        {[
          { icon: User, label: "Personal Details" },
          { icon: Building2, label: "Business Details" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            <item.icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-card-foreground text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-semibold">Sign Out</span>
      </button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Delete Account</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your personal details immediately. Tax declarations filed within the last six
              years can't be deleted yet — Nigerian tax law (NTAA 2025 s.31(5)) requires them to be kept
              for audit purposes. They'll remain, tied to your Tax ID only, until their retention period
              ends. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileMenu;
