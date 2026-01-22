import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

type PageHeaderProps = {
  title: string;
  actionButtonText?: string;
  onActionButtonClick?: () => void;
  children?: React.ReactNode;
};

export function PageHeader({ title, actionButtonText, onActionButtonClick, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        {actionButtonText && onActionButtonClick && (
          <Button onClick={onActionButtonClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {actionButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
