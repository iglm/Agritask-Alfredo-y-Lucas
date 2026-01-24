'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
};

export function KpiCard({ title, value, icon, href }: KpiCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={href ? "cursor-pointer transition-colors hover:bg-muted/80" : ""}
      tabIndex={href ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && href) {
            e.preventDefault();
            handleClick();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
