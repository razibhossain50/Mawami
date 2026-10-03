"use client";
import { Card } from "@heroui/react";
import { FileText, Shield, Users, Heart, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Terms of Service
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
                <Shield className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Acceptance of Terms</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  By accessing and using Mawami's matrimony services, you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
                <p>
                  These terms apply to all users of the site, including without limitation users who are 
                  browsers, vendors, customers, merchants, and/or contributors of content.
                </p>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">User Responsibilities</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>As a user of our platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and truthful information in your profile</li>
                  <li>Respect the privacy and dignity of other members</li>
                  <li>Not use the service for any illegal or unauthorized purpose</li>
                  <li>Not transmit any harmful, offensive, or inappropriate content</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Report any suspicious or inappropriate behavior</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-rose-600" />
                <h2 className="text-xl font-bold text-gray-800">Matrimony Services</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  Our platform provides matrimony services to help individuals find suitable life partners. 
                  We facilitate connections but do not guarantee successful matches or marriages.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Profile creation and management</li>
                  <li>Partner matching and recommendations</li>
                  <li>Communication tools between members</li>
                  <li>Profile verification services</li>
                  <li>Privacy protection measures</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-800">Prohibited Activities</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>The following activities are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Creating fake or misleading profiles</li>
                  <li>Harassing or stalking other members</li>
                  <li>Using the platform for commercial purposes</li>
                  <li>Sharing personal information of other members</li>
                  <li>Attempting to bypass security measures</li>
                  <li>Using automated tools or bots</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Account Termination</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to terminate or suspend your account at any time for violations 
                  of these terms or for any other reason at our sole discretion.
                </p>
                <p>Grounds for termination include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violation of these terms of service</li>
                  <li>Fraudulent or deceptive behavior</li>
                  <li>Harassment of other members</li>
                  <li>Inappropriate or offensive content</li>
                  <li>Non-payment of service fees (if applicable)</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-800">Limitation of Liability</h2>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  Mawami shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation, loss of profits, data, use, 
                  goodwill, or other intangible losses.
                </p>
                <p>
                  We do not guarantee the accuracy, completeness, or usefulness of any information 
                  on the platform or the results of using our services.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
