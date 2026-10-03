"use client";
import { Card } from "@heroui/react";
import { Shield, Lock, Eye, Users, Database, Bell } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Information We Collect</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  We collect information you provide directly to us, such as when you create an account, 
                  complete your biodata profile, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Profile information (age, location, education, profession)</li>
                  <li>Family and background information</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">How We Use Your Information</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain our matrimony services</li>
                  <li>Match you with potential life partners</li>
                  <li>Send you notifications and updates</li>
                  <li>Improve our platform and user experience</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Information Sharing</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  We do not sell, trade, or rent your personal information to third parties. 
                  Your information may be shared only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To other verified members for matching purposes</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-800">Data Security</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  We implement appropriate security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure hosting and infrastructure</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-rose-600" />
                <h2 className="text-xl font-bold text-gray-800">Your Rights</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access and review your personal information</li>
                  <li>Update or correct your information</li>
                  <li>Delete your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request data portability</li>
                </ul>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
