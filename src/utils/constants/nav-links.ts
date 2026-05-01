import { BriefcaseIcon, SearchIcon, ShoppingBagIcon, UserCheckIcon, BarChart3Icon, HelpCircleIcon } from "lucide-react";

export const NAV_LINKS = [
    {
        title: "Services",
        href: "/services",
        menu: [
            {
                title: "Find Freelancers",
                tagline: "Browse vetted talent for your projects.",
                href: "/browse-freelancers",
                icon: SearchIcon,
            },
            {
                title: "Post a Project",
                tagline: "Post your project and receive proposals.",
                href: "/post-project",
                icon: BriefcaseIcon,
            },
            {
                title: "Browse Templates",
                tagline: "Premium website templates for your business.",
                href: "/templates",
                icon: ShoppingBagIcon,
            },
            {
                title: "Become a Freelancer",
                tagline: "Offer your skills and build your career.",
                href: "/freelancer",
                icon: UserCheckIcon,
            },
        ],
    },
    {
        title: "Pricing",
        href: "/pricing",
    },
    {
        title: "For Business",
        href: "/enterprise",
    },
    {
        title: "Resources",
        href: "/resources",
        menu: [
            {
                title: "Blog",
                tagline: "Latest insights from the marketplace.",
                href: "/blog",
                icon: BarChart3Icon,
            },
            {
                title: "Help",
                tagline: "Get answers to your questions.",
                href: "/resources/help",
                icon: HelpCircleIcon,
            },
        ]
    },
    {
        title: "Changelog",
        href: "/changelog",
    },
];
