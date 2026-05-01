import { Metadata } from "next";

export const generateMetadata = ({
    title = `${process.env.NEXT_PUBLIC_APP_NAME} - The Link Management Platform for Businesses`,
    description = `${process.env.NEXT_PUBLIC_APP_NAME} is the link management platform for businesses. It helps you build, brand, and track your links.`,
    image = "/thumbnail.png",
    icons = [
        {
            rel: "apple-touch-icon",
            sizes: "32x32",
            url: "/apple-touch-icon.png"
        },
        {
            rel: "icon",
            sizes: "32x32",
            url: "/favicon-32x32.png"
        },
        {
            rel: "icon",
            sizes: "16x16",
            url: "/favicon-16x16.png"
        },
    ],
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string | null;
    icons?: Metadata["icons"];
    noIndex?: boolean;
} = {}): Metadata => ({
    title,
    description,
    icons,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://altfaze.com"),
    openGraph: {
        title,
        description,
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://altfaze.com",
        siteName: process.env.NEXT_PUBLIC_APP_NAME || "ALTFaze",
        locale: "en_US",
        ...(image && { images: [{ url: image, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
        title,
        description,
        ...(image && { card: "summary_large_image", images: [image] }),
        creator: "@altfaze_io",
    },
    alternates: {
        canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://altfaze.com",
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
});
