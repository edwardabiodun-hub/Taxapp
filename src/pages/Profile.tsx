import { motion } from "framer-motion";
import { useCountryTheme } from "@/contexts/CountryThemeContext";
import { useProfile } from "@/hooks/use-local-data";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import CountrySelector from "@/components/profile/CountrySelector";
import ProfileMenu from "@/components/profile/ProfileMenu";

const Profile = () => {
  const { country, setCountry } = useCountryTheme();
  const profile = useProfile();

  const displayName = profile?.name || "Loading...";
  const displayEmail = profile?.email || "—";
  const displayTaxId = profile?.taxId || "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-28"
    >
      <ProfileHeader name={displayName} email={displayEmail} taxId={displayTaxId} />
      <ProfileForm profile={profile} country={country} />
      <CountrySelector country={country} setCountry={setCountry} />
      <ProfileMenu />
    </motion.div>
  );
};

export default Profile;
