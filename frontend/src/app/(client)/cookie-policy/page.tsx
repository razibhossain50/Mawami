"use client";
import { Card } from "@heroui/react";
import { Cookie, Settings, Shield, Eye, Database, Bell } from "lucide-react";
import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cookie className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Cookie Policy
          </h1>
          <p className="text-gray-600 text-lg">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Cookie className="h-6 w-6 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-800">What Are Cookies</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  Cookies are small text files that are placed on your device when you visit our website. 
                  They help us provide you with a better experience and understand how you use our platform.
                </p>
                <p>
                  Cookies can be "session" cookies (temporary and deleted when you close your browser) 
                  or "persistent" cookies (stored on your device for a longer period).
                </p>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">How We Use Cookies</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>We use cookies for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                  <li><strong>Authentication Cookies:</strong> To keep you logged in securely</li>
                  <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> To understand how visitors use our site</li>
                  <li><strong>Security Cookies:</strong> To protect against fraud and abuse</li>
                </ul>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Types of Cookies We Use</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Essential Cookies</h3>
                  <p className="text-sm">
                    These cookies are necessary for the website to function properly. They enable basic 
                    functions like page navigation, access to secure areas, and form submissions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Performance Cookies</h3>
                  <p className="text-sm">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Functional Cookies</h3>
                  <p className="text-sm">
                    These cookies enable enhanced functionality and personalization, such as remembering 
                    your preferences and settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Targeting Cookies</h3>
                  <p className="text-sm">
                    These cookies may be set by our advertising partners to build a profile of your 
                    interests and show you relevant advertisements.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Third-Party Cookies</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  Some cookies on our website are set by third-party services that we use to enhance 
                  your experience:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Google Analytics:</strong> To analyze website traffic and usage patterns</li>
                  <li><strong>Payment Processors:</strong> To process secure payments</li>
                  <li><strong>Social Media:</strong> To enable social sharing and integration</li>
                  <li><strong>Security Services:</strong> To protect against fraud and attacks</li>
                </ul>
                <p className="text-sm text-gray-600">
                  These third-party services have their own privacy policies and cookie practices.
                </p>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-rose-600" />
                <h2 className="text-xl font-bold text-gray-800">Managing Your Cookie Preferences</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>You have several options for managing cookies:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Browser Settings:</strong> Most browsers allow you to control cookies through settings</li>
                  <li><strong>Cookie Consent:</strong> We provide cookie consent options when you first visit</li>
                  <li><strong>Opt-Out Tools:</strong> Use industry opt-out tools for advertising cookies</li>
                  <li><strong>Contact Us:</strong> Reach out if you have specific cookie concerns</li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Disabling certain cookies may affect website functionality 
                    and your user experience.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-800">Updates to This Policy</h2>
              </div>
            </Card.Header>
            <Card.Content className="p-6">
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons.
                </p>
                <p>
                  We will notify you of any material changes by posting the new Cookie Policy on this page 
                  and updating the "Last updated" date.
                </p>
                <p>
                  We encourage you to review this policy periodically to stay informed about how we use cookies.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
