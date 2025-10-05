import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSelector } from 'react-redux';
import { selectUser } from '@/redux/slices/AuthSlice';
import { selectLogo } from '@/redux/slices/ProjectSlice';
import { BASE_URL } from '@/api';
import { Logo } from '@/assets/images';
import { selectModules } from '@/redux/slices/AppStateSlice';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector(selectUser);
  const logo = useSelector(selectLogo);
  const modules = useSelector(selectModules);

  const logoURL = React.useMemo(
    () => `${BASE_URL}/uploads/projects/${logo}`,
    [logo]
  );
  const [imageSource, setImageSource] = React.useState(logoURL);

  const handleError = () => {
    console.error('Failed to load logo image, switching to fallback');
    setImageSource(Logo); // Switch to fallback URL
  };

  const teamData = {
    name: user?.company?.name,
    logo: imageSource,
    plan: user?.name,
  };

  const modulesRendered = modules?.map((module) => ({
    title: module.title,
    url: module.path,
    icon: module.icon,
  }));

  const userData = {
    name: user?.name,
    email: user?.work_email,
    avatar: user?.name,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamData} onError={handleError} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={modulesRendered} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
