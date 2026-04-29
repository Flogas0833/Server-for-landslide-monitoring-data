import * as React from "react"
import { cn } from "@/lib/utils"

const Loader = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex justify-center items-center", className)} {...props}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
))
Loader.displayName = "Loader"

export { Loader }
