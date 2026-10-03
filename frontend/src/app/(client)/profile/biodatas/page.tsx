

"use client";
import { BiodataSearch } from "@/components/biodata/BiodataSearch";
import { Card, Button } from "@heroui/react";
import { PlusCircle, FileText, Camera, Heart, Sparkles, Zap, Users, UserCheck, Award, TrendingUp, Globe } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

const AllBiodatas = () => {
    const successStory = [
        {
            icon: FileText,
            title: "Share Your Story",
            description: "Tell us about yourself, your values, dreams, and what makes you special",
            color: "text-rose-600",
            bgColor: "bg-gradient-to-br from-rose-100 to-pink-100",
            emoji: "📝"
        },
        {
            icon: Camera,
            title: "Show Your Smile",
            description: "Upload authentic photos that showcase your personality and warmth",
            color: "text-pink-600",
            bgColor: "bg-gradient-to-br from-pink-100 to-purple-100",
            emoji: "📸"
        },
        {
            icon: Heart,
            title: "Find Your Match",
            description: "Share your preferences and vision for your ideal life partner",
            color: "text-purple-600",
            bgColor: "bg-gradient-to-br from-purple-100 to-rose-100",
            emoji: "💖"
        }
    ];

    const stats = [
        {
            icon: Users,
            number: "50,000+",
            label: "Active Members",
            color: "text-rose-600",
            bgColor: "bg-gradient-to-br from-rose-100 to-pink-100",
            emoji: "👥"
        },
        {
            icon: UserCheck,
            number: "25,000+",
            label: "Verified Profiles",
            color: "text-pink-600",
            bgColor: "bg-gradient-to-br from-pink-100 to-purple-100",
            emoji: "✅"
        },
        {
            icon: Heart,
            number: "15,000+",
            label: "Success Stories",
            color: "text-purple-600",
            bgColor: "bg-gradient-to-br from-purple-100 to-rose-100",
            emoji: "💕"
        },
        {
            icon: Award,
            number: "98%",
            label: "Satisfaction Rate",
            color: "text-emerald-600",
            bgColor: "bg-gradient-to-br from-emerald-100 to-green-100",
            emoji: "🏆"
        }
    ];

    const achievements = [
        { icon: TrendingUp, text: "Growing by 1000+ members monthly" },
        { icon: Globe, text: "Connecting hearts across 50+ cities" },
        { icon: Heart, text: "New success story every day" }
    ];

    return (
        <div className="-mt-20">
            <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600">Loading search...</p>
                    </div>
                </div>
            }>
                <BiodataSearch />
            </Suspense>
            <section className="py-12 md:py-24 px-4 bg-gradient-to-br from-white via-rose-50/50 to-pink-50/50 relative overflow-hidden">
                {/* Subtle Background Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 text-6xl">💕</div>
                    <div className="absolute top-20 right-20 text-4xl">✨</div>
                    <div className="absolute bottom-20 left-1/4 text-5xl">💑</div>
                    <div className="absolute bottom-10 right-10 text-3xl">🌟</div>
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10 p-4">
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-100 to-pink-100 px-4 py-2 rounded-full mb-6 shadow-sm border border-rose-200">
                            <Sparkles className="h-4 w-4 text-rose-500" />
                        </div>
                        <h2 className="text-title-lg font-bold text-gray-800 mb-4">
                            Your Perfect Match Awaits
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Join our trusted community of hearts seeking meaningful connections.
                            Creating your matrimony profile is simple, secure, and completely free.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {successStory.map((item, index) => (
                            <Card key={index} className="border-2 border-rose-100 hover:border-rose-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group bg-white/80 backdrop-blur-sm">
                                <Card.Content className="p-8 text-center relative">
                                    <div className={`${item.bgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 mt-6 group-hover:scale-110 transition-transform shadow-md`}>
                                        <item.icon className={`h-8 w-8 ${item.color}`} />
                                    </div>

                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                        {item.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed">
                                        {item.description}
                                    </p>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>

                    {/* Beautiful Call-to-Action Section */}
                    <div className="relative group">
                        {/* Glowing Background Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>

                        {/* Main CTA Container */}
                        <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl p-10 md:p-12 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
                            {/* Decorative Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-6 left-6">
                                    <Heart className="h-12 w-12 fill-current animate-pulse" />
                                </div>
                                <div className="absolute top-8 right-8">
                                    <Sparkles className="h-10 w-10 animate-pulse delay-1000" />
                                </div>
                                <div className="absolute bottom-6 left-1/3">
                                    <Users className="h-8 w-8 animate-pulse delay-2000" />
                                </div>
                                <div className="absolute bottom-8 right-6">
                                    <Award className="h-10 w-10 animate-pulse delay-500" />
                                </div>
                            </div>

                            {/* Floating Particles Effect */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce delay-300"></div>
                                <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-700"></div>
                                <div className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce delay-1000"></div>
                            </div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                                {/* Left Content Section */}
                                <div className="text-center lg:text-left flex-1">
                                    {/* Main Heading */}
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                                                <Zap className="h-8 w-8 animate-pulse text-yellow-300" />
                                            </div>
                                            <span className="bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">
                                                Ready to Find Your Soulmate?
                                            </span>
                                        </div>
                                    </h3>
                                </div>

                                {/* Right Button Section */}
                                <div className="flex flex-col sm:flex-row gap-4 lg:flex-col xl:flex-row">
                                    {/* Primary CTA Button */}
                                    <Button className="group/btn relative px-10 py-6 bg-white text-rose-600 hover:bg-rose-50 font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl overflow-hidden">
                                        <Link href="/profile/biodatas/edit/new">
                                            {/* Button Background Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-pink-50 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>

                                            {/* Button Content */}
                                            <div className="relative flex items-center gap-3">
                                                <div className="bg-rose-100 rounded-full p-2 group-hover/btn:bg-rose-200 transition-colors duration-300">
                                                    <PlusCircle className="h-6 w-6 group-hover/btn:rotate-90 transition-transform duration-300" />
                                                </div>
                                                <span>Create Biodata</span>
                                            </div>

                                            {/* Button Shine Effect */}
                                            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Bottom Accent Line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-24 px-4 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden">
                {/* Soft Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-xl"></div>
                    </div>
                    <div className="absolute bottom-32 right-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-200/40 to-purple-200/40 rounded-full blur-xl"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-200/40 to-rose-200/40 rounded-full blur-xl"></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative p-4 z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 shadow-sm border border-rose-200">
                            <Sparkles className="h-4 w-4 text-rose-500" />
                            <span className="text-rose-700 font-medium">Our Success</span>
                        </div>
                        <h2 className="text-title-lg font-bold text-gray-800 mb-4">
                            Trusted by Thousands of Hearts
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Every number tells a story of love, connection, and dreams fulfilled
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {stats.map((stat, index) => (
                            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
                                <Card.Content className="p-8 text-center relative overflow-hidden">
                                    <div className={`${stat.bgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                                    </div>

                                    <div className={`text-4xl font-bold ${stat.color} mb-2 group-hover:scale-105 transition-transform`}>
                                        {stat.number}
                                    </div>

                                    <div className="text-gray-600 font-medium">
                                        {stat.label}
                                    </div>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>

                    {/* Achievements Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-rose-100">
                        <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
                            Why Choose Our Matrimony Platform?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {achievements.map((achievement, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow border border-rose-100">
                                    <div className="flex-none bg-gradient-to-r from-rose-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center shadow-md">
                                        <achievement.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">{achievement.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AllBiodatas;