import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { SettingsComponent } from './shared/components/settings/settings.component';
import { AppSettingsComponent } from './shared/components/settings/app-settings/app-settings.component';
import { AuthSettingsComponent } from './shared/components/settings/auth-settings/auth-settings.component';
import { BitcoinConfigComponent } from './shared/components/settings/bitcoin-config/bitcoin-config.component';
import { NodeConfigComponent } from './shared/components/node-config/node-config.component';
import { LNPConfigComponent } from './shared/components/node-config/lnp-config/lnp-config.component';
import { NodeSettingsComponent } from './shared/components/node-config/node-settings/node-settings.component';
import { ServicesSettingsComponent } from './shared/components/node-config/services-settings/services-settings.component';
import { LoopServiceSettingsComponent } from './shared/components/node-config/services-settings/loop-service-settings/loop-service-settings.component';
import { BoltzServiceSettingsComponent } from './shared/components/node-config/services-settings/boltz-service-settings/boltz-service-settings.component';
import { HelpComponent } from './shared/components/help/help.component';
import { LoginComponent } from './shared/components/login/login.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ErrorComponent } from './shared/components/error/error.component';
import { AuthGuard } from './shared/services/auth.guard';
import { ExperimentalSettingsComponent } from './shared/components/node-config/experimental-settings/experimental-settings.component';
import { PeerswapServiceSettingsComponent } from './shared/components/node-config/services-settings/peerswap-service-settings/peerswap-service-settings.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'lnd', loadChildren: () => import('./lnd/lnd.module').then((childModule) => childModule.LNDModule), canActivate: [AuthGuard] },
  { path: 'cln', loadChildren: () => import('./cln/cln.module').then((childModule) => childModule.CLNModule), canActivate: [AuthGuard] },
  { path: 'ecl', loadChildren: () => import('./eclair/ecl.module').then((childModule) => childModule.ECLModule), canActivate: [AuthGuard] },
  {
    path: 'settings', component: SettingsComponent, canActivate: [AuthGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'app' },
      { path: 'app', component: AppSettingsComponent, canActivate: [AuthGuard] },
      { path: 'auth', component: AuthSettingsComponent, canActivate: [AuthGuard] },
      { path: 'bconfig', component: BitcoinConfigComponent, canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'config', component: NodeConfigComponent, canActivate: [AuthGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'layout' },
      { path: 'layout', component: NodeSettingsComponent, canActivate: [AuthGuard] },
      {
        path: 'serviceconf', component: ServicesSettingsComponent, canActivate: [AuthGuard], children: [
          { path: 'loop', component: LoopServiceSettingsComponent, canActivate: [AuthGuard] },
          { path: 'boltz', component: BoltzServiceSettingsComponent, canActivate: [AuthGuard] },
          { path: 'prswp', component: PeerswapServiceSettingsComponent, canActivate: [AuthGuard] }
        ]
      },
      { path: 'experimental', component: ExperimentalSettingsComponent, canActivate: [AuthGuard] },
      { path: 'lnconfig', component: LNPConfigComponent, canActivate: [AuthGuard] }
    ]
  },
  { path: 'help', component: HelpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'error', component: ErrorComponent },
  { path: '**', component: NotFoundComponent }
];

// Export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes, { enableTracing: true });
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes);
