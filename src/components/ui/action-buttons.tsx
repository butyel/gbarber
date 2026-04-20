"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  className?: string;
}

export const ActionButtons = memo(function ActionButtons({
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
  className,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-2">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={editDisabled}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
});
