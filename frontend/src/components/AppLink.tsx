'use client';

import { useEffect, useState } from 'react';

export default function AppLink({
    href,
    className,
    children,
    ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
    // We default to desktop behavior for server render, then adjust if mobile.
    // Using target="_blank" prevents iOS and Android from triggering their native App Deep-Links.
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    }, []);

    const target = isMobile ? '_self' : '_blank';
    const rel = isMobile ? undefined : 'noopener noreferrer';

    return (
        <a
            href={href}
            target={target}
            rel={rel}
            className={className}
            suppressHydrationWarning
            {...props}
        >
            {children}
        </a>
    );
}
