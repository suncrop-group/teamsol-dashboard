'use client';

import { Reports } from '@/assets/icons';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string; // URL/path to icon
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Modules</SidebarGroupLabel>
      <SidebarMenu>
        {items?.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={item.isActive ? 'bg-muted' : ''}
            >
              <Link to={item.url} className="flex items-center">
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="size-8 mr-2 object-contain rounded-lg"
                  />
                )}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {/* Render subitems (not collapsible, just indented) */}
          </SidebarMenuItem>
        ))}

        {/* Reports */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Reports">
            <Link to="/reports" className="flex items-center">
              <img
                src={Reports} // Replace with actual icon path
                alt="Reports"
                className="size-8 mr-2 object-contain rounded-lg"
              />
              <span>Reports</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
