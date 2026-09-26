/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const en = {
  home: 'Home', map: 'Map', reports: 'Civic reports', alerts: 'Health alerts', inbox: 'Inbox',
  profile: 'Profile', review: 'Review', admin: 'Admin', login: 'Login', register: 'Register',
  logout: 'Log out', menu: 'Menu', language: 'Language', search: 'Search campaigns',
  landingTitle: 'Verified help. A safer city.', landingLead: 'Find trusted requests for blood, animal care, charity and relief. Share local hazards and spot health trends early.',
  getStarted: 'Get started', explore: 'Explore campaigns', howItWorks: 'How CivicSync works',
  verifiedRequests: 'Verified requests', verifiedText: 'Qualified partners check requests before the public can support them.',
  communityReports: 'Community reports', reportsText: 'Neighbors map waterlogging and confirm reports together.',
  healthSignals: 'Health signals', healthText: 'Anonymous symptom reports reveal area trends without identifying people.',
  helpText: 'Offline support is recorded and confirmed by the requester. Civic reports are separate from donations.',
  welcome: 'Welcome back', join: 'Join CivicSync', email: 'Email', password: 'Password', fullName: 'Full name',
  signIn: 'Sign in', createAccount: 'Create account', noAccount: 'Need an account?', haveAccount: 'Already have an account?',
  loading: 'Loading…', retry: 'Retry', empty: 'Nothing here yet.', error: 'Something went wrong. Please try again.',
  all: 'All', blood: 'Blood', petCare: 'Pet care', charity: 'Charity', disasterRelief: 'Disaster relief',
  createRequest: 'Request help', title: 'Title', description: 'Description', category: 'Category', location: 'Location',
  amount: 'Amount (BDT)', goalAmount: 'Goal amount (BDT)', optional: 'Optional', submit: 'Submit', cancel: 'Cancel',
  pending: 'Pending', verified: 'Verified', rejected: 'Rejected', completed: 'Completed',
  donate: 'Record offline contribution', pledge: 'Pledge to help', received: 'Received', awaitingReceipt: 'Awaiting receipt confirmation',
  supporters: 'Supporters', confirmReceipt: 'Confirm received', myPosts: 'My requests', mySupport: 'My support',
  trustTrail: 'Trust trail', submitted: 'Submitted', reviewed: 'Reviewed by', evidence: 'Outcome evidence',
  submitOutcome: 'Submit outcome', approveOutcome: 'Approve outcome', note: 'Note',
  reportWater: 'Report waterlogging', useLocation: 'Use my location', latitude: 'Latitude', longitude: 'Longitude',
  confirm: 'Confirm report', resolve: 'Mark resolved', unconfirmed: 'Unconfirmed', confirmed: 'Confirmed',
  reportSymptom: 'Report a symptom', area: 'Area or neighborhood', symptom: 'Symptom', anonymous: 'Submit anonymously',
  thanks: 'Thank you for helping your community.', watch: 'Watch', normal: 'Normal', reportCount: 'Reports',
  lastDays: 'Last 14 days', noAlerts: 'No health watch alerts right now.',
  settings: 'Settings', phone: 'Phone', interests: 'Interests', reminders: 'In-app reminders', save: 'Save changes',
  recommendations: 'Recommended for you', nearYou: 'Near your area', yourInterest: 'Matches your interests', recentVerified: 'Recently verified',
  noNotifications: 'No notifications yet.', markRead: 'Mark read', matchingCampaign: 'A matching verified campaign is available.',
  activityReminder: 'It has been a while since your last support. Browse current verified requests.',
  pendingReviews: 'Pending requests', pendingOutcomes: 'Pending outcomes', approve: 'Approve', reject: 'Reject',
  users: 'Users and partners', disputes: 'Disputes', flag: 'Flag for review', reason: 'Reason', dismiss: 'Dismiss',
  resolveDispute: 'Resolve', role: 'Role', qualifiedCategories: 'Qualified categories', legacyReview: 'Legacy role: review needed',
  hideContent: 'Hide content',
  update: 'Update', noResults: 'No results found.', back: 'Back', share: 'Share', copied: 'Link copied',
  comments: 'Comments', writeComment: 'Write a comment', postComment: 'Post comment',
  signInRequired: 'Sign in to continue.', reportSubmitted: 'Your report was submitted.',
  pledged: 'Pledged', userRole: 'User', verifierRole: 'Verifier partner', adminRole: 'Admin',
  campaignType: 'Campaign', civicType: 'Civic report', openDispute: 'Open', resolvedDispute: 'Resolved', dismissedDispute: 'Dismissed',
};

const bn = {
  home: 'হোম', map: 'মানচিত্র', reports: 'নাগরিক প্রতিবেদন', alerts: 'স্বাস্থ্য সতর্কতা', inbox: 'ইনবক্স',
  profile: 'প্রোফাইল', review: 'যাচাই', admin: 'অ্যাডমিন', login: 'লগইন', register: 'নিবন্ধন',
  logout: 'লগ আউট', menu: 'মেনু', language: 'ভাষা', search: 'অভিযান খুঁজুন',
  landingTitle: 'যাচাইকৃত সহায়তা। নিরাপদ শহর।', landingLead: 'রক্ত, প্রাণী সেবা, দাতব্য ও ত্রাণের বিশ্বস্ত অনুরোধ খুঁজুন। স্থানীয় ঝুঁকি জানান এবং স্বাস্থ্য প্রবণতা আগে দেখুন।',
  getStarted: 'শুরু করুন', explore: 'অভিযান দেখুন', howItWorks: 'সিভিকসিঙ্ক যেভাবে কাজ করে',
  verifiedRequests: 'যাচাইকৃত অনুরোধ', verifiedText: 'সহায়তার আগে যোগ্য অংশীদার অনুরোধ যাচাই করেন।',
  communityReports: 'নাগরিক প্রতিবেদন', reportsText: 'প্রতিবেশীরা জলাবদ্ধতা চিহ্নিত ও নিশ্চিত করেন।',
  healthSignals: 'স্বাস্থ্য সংকেত', healthText: 'পরিচয় প্রকাশ ছাড়াই লক্ষণ প্রতিবেদন এলাকাভিত্তিক প্রবণতা দেখায়।',
  helpText: 'অফলাইন সহায়তা অনুরোধকারী নিশ্চিত করেন। নাগরিক প্রতিবেদন অনুদান থেকে আলাদা।',
  welcome: 'আবার স্বাগতম', join: 'সিভিকসিঙ্কে যোগ দিন', email: 'ইমেইল', password: 'পাসওয়ার্ড', fullName: 'পুরো নাম',
  signIn: 'সাইন ইন', createAccount: 'অ্যাকাউন্ট খুলুন', noAccount: 'অ্যাকাউন্ট নেই?', haveAccount: 'আগেই অ্যাকাউন্ট আছে?',
  loading: 'লোড হচ্ছে…', retry: 'আবার চেষ্টা করুন', empty: 'এখনো কিছু নেই।', error: 'সমস্যা হয়েছে। আবার চেষ্টা করুন।',
  all: 'সব', blood: 'রক্ত', petCare: 'প্রাণী সেবা', charity: 'দাতব্য', disasterRelief: 'দুর্যোগ ত্রাণ',
  createRequest: 'সহায়তা চান', title: 'শিরোনাম', description: 'বিবরণ', category: 'ধরন', location: 'স্থান',
  amount: 'পরিমাণ (টাকা)', goalAmount: 'লক্ষ্যমাত্রা (টাকা)', optional: 'ঐচ্ছিক', submit: 'জমা দিন', cancel: 'বাতিল',
  pending: 'অপেক্ষমাণ', verified: 'যাচাইকৃত', rejected: 'প্রত্যাখ্যাত', completed: 'সম্পন্ন',
  donate: 'অফলাইন সহায়তা নথিভুক্ত করুন', pledge: 'সহায়তার অঙ্গীকার', received: 'প্রাপ্ত', awaitingReceipt: 'প্রাপ্তির নিশ্চিতকরণের অপেক্ষায়',
  supporters: 'সহায়তাকারী', confirmReceipt: 'প্রাপ্তি নিশ্চিত করুন', myPosts: 'আমার অনুরোধ', mySupport: 'আমার সহায়তা',
  trustTrail: 'বিশ্বাসের ধাপ', submitted: 'জমা হয়েছে', reviewed: 'যাচাই করেছেন', evidence: 'ফলাফলের প্রমাণ',
  submitOutcome: 'ফলাফল জমা দিন', approveOutcome: 'ফলাফল অনুমোদন', note: 'নোট',
  reportWater: 'জলাবদ্ধতা জানান', useLocation: 'আমার অবস্থান ব্যবহার করুন', latitude: 'অক্ষাংশ', longitude: 'দ্রাঘিমাংশ',
  confirm: 'প্রতিবেদন নিশ্চিত করুন', resolve: 'সমাধান হয়েছে', unconfirmed: 'অনিশ্চিত', confirmed: 'নিশ্চিত',
  reportSymptom: 'লক্ষণ জানান', area: 'এলাকা', symptom: 'লক্ষণ', anonymous: 'পরিচয় গোপন রেখে জমা দিন',
  thanks: 'সমাজকে সাহায্য করার জন্য ধন্যবাদ।', watch: 'সতর্কতা', normal: 'স্বাভাবিক', reportCount: 'প্রতিবেদন',
  lastDays: 'গত ১৪ দিন', noAlerts: 'এখন কোনো স্বাস্থ্য সতর্কতা নেই।',
  settings: 'সেটিংস', phone: 'ফোন', interests: 'আগ্রহ', reminders: 'অ্যাপের স্মরণিকা', save: 'পরিবর্তন সংরক্ষণ',
  recommendations: 'আপনার জন্য প্রস্তাবনা', nearYou: 'আপনার এলাকায়', yourInterest: 'আপনার আগ্রহের সঙ্গে মেলে', recentVerified: 'সম্প্রতি যাচাইকৃত',
  noNotifications: 'এখন কোনো বার্তা নেই।', markRead: 'পড়া হয়েছে', matchingCampaign: 'আপনার সঙ্গে মেলে এমন যাচাইকৃত অভিযান এসেছে।',
  activityReminder: 'অনেক দিন সহায়তা করা হয়নি। বর্তমান যাচাইকৃত অনুরোধ দেখুন।',
  pendingReviews: 'অপেক্ষমাণ অনুরোধ', pendingOutcomes: 'অপেক্ষমাণ ফলাফল', approve: 'অনুমোদন', reject: 'প্রত্যাখ্যান',
  users: 'ব্যবহারকারী ও অংশীদার', disputes: 'অভিযোগ', flag: 'পর্যালোচনার জন্য জানান', reason: 'কারণ', dismiss: 'বাতিল',
  resolveDispute: 'সমাধান', role: 'ভূমিকা', qualifiedCategories: 'যোগ্যতার ধরন', legacyReview: 'পুরোনো ভূমিকা: যাচাই দরকার',
  hideContent: 'বিষয়বস্তু আড়াল করুন',
  update: 'হালনাগাদ', noResults: 'কোনো ফল পাওয়া যায়নি।', back: 'ফিরে যান', share: 'শেয়ার', copied: 'লিংক কপি হয়েছে',
  comments: 'মন্তব্য', writeComment: 'মন্তব্য লিখুন', postComment: 'মন্তব্য পাঠান',
  signInRequired: 'চালিয়ে যেতে লগইন করুন।', reportSubmitted: 'আপনার প্রতিবেদন জমা হয়েছে।',
  pledged: 'অঙ্গীকার করা হয়েছে', userRole: 'ব্যবহারকারী', verifierRole: 'যাচাইকারী অংশীদার', adminRole: 'অ্যাডমিন',
  campaignType: 'অভিযান', civicType: 'নাগরিক প্রতিবেদন', openDispute: 'উন্মুক্ত', resolvedDispute: 'সমাধান হয়েছে', dismissedDispute: 'খারিজ',
};

const LocaleContext = createContext(null);
export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'en');
  useEffect(() => { localStorage.setItem('locale', locale); document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key) => (locale === 'bn' ? bn[key] : en[key]) || en[key] || key }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
export const categoryKey = { BLOOD: 'blood', PET_CARE: 'petCare', CHARITY: 'charity', DISASTER_RELIEF: 'disasterRelief' };
export const statusKey = { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected', COMPLETED: 'completed' };
