import { BriefcaseIcon, CheckCircleIcon, CreditCardIcon, ShieldCheckIcon } from "lucide-react";

export const DEFAULT_AVATAR_URL = "https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear&backgroundRotation=0,360&seed=";

export const PAGINATION_LIMIT = 10;

export const COMPANIES = [
    {
        name: "TechStartup",
        logo: "/assets/company-01.svg",
    },
    {
        name: "DesignCo",
        logo: "/assets/company-02.svg",
    },
    {
        name: "WebAgency",
        logo: "/assets/company-03.svg",
    },
    {
        name: "DevStudio",
        logo: "/assets/company-04.svg",
    },
    {
        name: "CreativeHub",
        logo: "/assets/company-05.svg",
    },
    {
        name: "BuildLab",
        logo: "/assets/company-06.svg",
    }
] as const;

export const PROCESS = [
    {
        title: "Post Your Project",
        description: "Describe your project requirements, budget, and timeline to find the perfect freelancer.",
        icon: BriefcaseIcon,
    },
    {
        title: "Receive Proposals",
        description: "Get proposals from vetted freelancers with proven experience in your industry.",
        icon: CheckCircleIcon,
    },
    {
        title: "Secure Payment",
        description: "Use our escrow system to ensure safe transactions and protect both parties.",
        icon: CreditCardIcon,
    },
    {
        title: "Collaborate & Deliver",
        description: "Work seamlessly with your freelancer and receive quality deliverables on time.",
        icon: ShieldCheckIcon,
    },
] as const;

export const FEATURES = [
    {
        title: "Verified Freelancers",
        description: "Access to pre-vetted professionals with proven track records.",
    },
    {
        title: "Secure Payments",
        description: "Escrow-protected transactions for both clients and freelancers.",
    },
    {
        title: "Real-time Chat",
        description: "Built-in messaging system for seamless project communication.",
    },
    {
        title: "Portfolio Showcase",
        description: "Freelancers can showcase their work and build their reputation.",
    },
    {
        title: "Milestone Based",
        description: "Break projects into milestones with phased payments.",
    },
    {
        title: "Ratings & Reviews",
        description: "Transparent ratings help you find the best fit for your needs.",
    },
] as const;

export const REVIEWS = [
    {
        name: "Raj Patel",
        username: "@rajpatel",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        rating: 5,
        review: "ALTFaze helped me hire the perfect web developer for my startup. The process was seamless and the quality exceeded expectations. Highly recommend!"
    },
    {
        name: "Sarah Chen",
        username: "@sarahchen",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg",
        rating: 5,
        review: "As a freelancer, I've found incredible projects on ALTFaze. The platform is transparent, secure, and the community is amazing."
    },
    {
        name: "Marcus Johnson",
        username: "@marcusjohnson",
        avatar: "https://randomuser.me/api/portraits/men/2.jpg",
        rating: 5,
        review: "Best platform for finding global talent. The escrow system gives me peace of mind, and I've completed 50+ successful projects here."
    },
    {
        name: "Sophia Brown",
        username: "@sophiabrown",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        rating: 4,
        review: "This app is fantastic! It offers everything I need to manage my links efficiently."
    },
    {
        name: "James Taylor",
        username: "@jamestaylor",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        rating: 5,
        review: "Absolutely love this app! It's intuitive and feature-rich. Has significantly improved how I manage and track links."
    },
    {
        name: "Olivia Martinez",
        username: "@oliviamartinez",
        avatar: "https://randomuser.me/api/portraits/women/3.jpg",
        rating: 4,
        review: "Great app with a lot of potential. It has already saved me a lot of time. Looking forward to future updates and improvements."
    },
    {
        name: "William Garcia",
        username: "@williamgarcia",
        avatar: "https://randomuser.me/api/portraits/men/4.jpg",
        rating: 5,
        review: "This app is a game-changer for link management. It's easy to use, extremely powerful and highly recommended!"
    },
    {
        name: "Mia Rodriguez",
        username: "@miarodriguez",
        avatar: "https://randomuser.me/api/portraits/women/4.jpg",
        rating: 4,
        review: "I've tried several link management tools, but this one stands out. It's simple, effective."
    },
    {
        name: "Henry Lee",
        username: "@henrylee",
        avatar: "https://randomuser.me/api/portraits/men/5.jpg",
        rating: 5,
        review: "This app has transformed my workflow. Managing and analyzing links is now a breeze. I can't imagine working without it."
    },
] as const;
