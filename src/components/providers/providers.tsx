"use client";

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
    children: React.ReactNode;
}

const Providers = ({ children }: Props) => {
    const [client] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={client}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </QueryClientProvider>
    )
};

export default Providers
