import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a]">
      <div className="text-center">
        <img src="/Stackd.png" alt="Stackd Logo" className="h-16 mb-8 mx-auto" />
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#2E3436] shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-300",
              socialButtonsBlockButton: "bg-[#1a1a1a] border-gray-600 text-white hover:bg-[#3a4244]",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-[#1a1a1a] border-gray-600 text-white",
              footerActionLink: "text-blue-400 hover:text-blue-300",
            }
          }}
        />
      </div>
    </div>
  );
}
