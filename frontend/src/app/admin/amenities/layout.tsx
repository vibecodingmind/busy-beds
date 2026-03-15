import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Manage Amenities | Admin | BusyBeds',
    description: 'Manage hotel amenities and categories.',
};

export default function AmenitiesLayout({ children }: { children: React.ReactNode }) {
    return <div className="space-y-6">{children}</div>;
}
