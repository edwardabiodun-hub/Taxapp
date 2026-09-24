import { User } from "lucide-react";

interface ProfileHeaderProps {
  name: string;
  email: string;
  taxId: string;
}

const ProfileHeader = ({ name, email, taxId }: ProfileHeaderProps) => (
  <div className="gradient-primary rounded-xl p-6 text-center text-primary-foreground">
    <div className="w-20 h-20 rounded-full bg-background/20 mx-auto flex items-center justify-center mb-3">
      <User className="w-10 h-10" />
    </div>
    <h2 className="font-display font-bold text-xl">{name}</h2>
    <p className="text-sm opacity-80">{email}</p>
    <div className="mt-3 inline-flex items-center gap-2 bg-background/15 rounded-full px-4 py-1.5">
      <span className="text-xs font-medium">Tax ID: {taxId}</span>
    </div>
  </div>
);

export default ProfileHeader;
