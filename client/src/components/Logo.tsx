import logoImage from "@assets/Secundaire-logo_zwart-en-groen (1).png";

export default function Logo() {
  return (
    <div className="h-8 w-auto flex items-center">
      <img src={logoImage} alt="Bedieningen Profiel Logo" className="h-8 w-auto mr-2" />
      <span className="font-bold text-gray-900">BEDIENINGEN PROFIEL</span>
    </div>
  );
}
