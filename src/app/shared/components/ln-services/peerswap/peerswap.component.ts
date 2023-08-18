import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-peerswap',
  templateUrl: './peerswap.component.html',
  styleUrls: ['./peerswap.component.scss']
})
export class PeerswapComponent implements OnInit, OnDestroy {

  public faHandshake = faHandshake;
  public links = [{ link: 'pspeers', name: 'Peers' }, { link: 'psout', name: 'Swap Out' }, { link: 'psin', name: 'Swap In' }, { link: 'pscanceled', name: 'Swap Canceled' }];
  public activeTab = this.links[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeTab = linkFound ? linkFound : this.links[0];
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          this.activeTab = linkFound ? linkFound : this.links[0];
        }
      });
  }

  // onSelectedIndexChange(activeTab: any) {
  //   if (activeTab.link === 'psin') {
  //     this.selectedSwapType = SwapTypeEnum.SWAP_IN;
  //     this.swapsData = this.swaps.swaps || [];
  //   } else {
  //     this.selectedSwapType = SwapTypeEnum.SWAP_OUT;
  //     this.swapsData = this.swaps.reverseSwaps || [];
  //   }
  // }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
