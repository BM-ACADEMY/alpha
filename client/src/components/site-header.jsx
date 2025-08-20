import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from "@/components/ui/command"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { adminMenuItems } from "@/modules/common/utils/adminMenuItem"
import { Search } from "lucide-react"

export function SiteHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Find the current menu item based on the longest matching URL prefix
  const currentMenuItem = adminMenuItems.navMain.reduce((bestMatch, item) => {
    if (location.pathname.startsWith(item.url)) {
      return item.url.length > (bestMatch?.url?.length || 0) ? item : bestMatch
    }
    return bestMatch
  }, null)

  return (
    <>
      <header
        className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]"
      >
        <div className="flex w-full items-center gap-1 p-4 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          
          {/* Breadcrumb Component */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin-dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {currentMenuItem && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentMenuItem.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Right side with Search Input */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 w-[200px] justify-between px-2  text-left text-sm cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <span className="text-muted-foreground">Search...</span>
              <Search className="w-4 h-4 text-gray-400" />
            </Button>

           
          </div>
        </div>
      </header>

      {/* Command Dialog for Search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {adminMenuItems.navMain.map((item) => (
                <CommandItem
                  key={item.url}
                  onSelect={() => {
                    setOpen(false)
                    navigate(item.url) // Using navigate for client-side navigation
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}