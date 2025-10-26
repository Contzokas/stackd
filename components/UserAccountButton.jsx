"use client";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function UserAccountButton() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // User is signed in - show Clerk's UserButton with profile photo
  if (isSignedIn) {
    const username = user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'user';
    
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-white text-base font-medium">@{username}</p>
            <p className="text-gray-400 text-sm">Click to manage account</p>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-16 h-16 rounded-full ring-2 ring-gray-600 hover:ring-blue-400 transition-all"
              }
            }}
          />
        </div>
      </div>
    );
  }

  // User is not signed in - show sign in/sign up menu
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-16 h-16 bg-[#2E3436] rounded-full flex items-center justify-center text-white hover:bg-[#3a4244] transition-colors ring-2 ring-gray-600 hover:ring-blue-400"
        title="Account"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-9 w-9" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 bg-[#2E3436] rounded-lg shadow-2xl overflow-hidden min-w-[200px]">
          <div className="p-2">
            <SignInButton mode="modal">
              <button className="w-full text-left px-4 py-2 text-white hover:bg-[#3a4244] rounded transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full text-left px-4 py-2 text-white hover:bg-[#3a4244] rounded transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
      )}
    </div>
  );
}
