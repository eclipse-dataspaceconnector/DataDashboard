import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {first, map, switchMap} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {
  AssetDto,
  AssetService,
  AssetEntryDto,
} from "../../../edc-dmgmt-client";
import {AssetEditorDialog} from "../asset-editor-dialog/asset-editor-dialog.component";


@Component({
  selector: 'edc-demo-asset-viewer',
  templateUrl: './asset-viewer.component.html',
  styleUrls: ['./asset-viewer.component.scss']
})
export class AssetViewerComponent implements OnInit {

  filteredAssets$: Observable<AssetDto[]> = of([]);
  searchText = '';
  isTransfering = false;
  private fetch$ = new BehaviorSubject(null);

  constructor(private assetService: AssetService, private readonly dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.filteredAssets$ = this.fetch$
      .pipe(
        switchMap(() => {
          const assets$ = this.assetService.getAllAssets();
          return !!this.searchText ?
            assets$.pipe(map(assets => assets.filter(asset => asset.properties["asset:prop:name"].includes(this.searchText))))
            :
            assets$;
        }));
  }

  isBusy() {
    return this.isTransfering;
  }

  onSearch() {
    this.fetch$.next(null);
  }

  onEdit(assetDto: AssetDto) {
    const dialogRef = this.dialog.open(AssetEditorDialog, {
      data: assetDto
    });

    dialogRef.afterClosed().pipe(first()).subscribe((result: { assetEntryDto?: AssetEntryDto }) => {
      const updatedAsset = result.assetEntryDto;
      if (updatedAsset) {
        this.assetService.removeAsset(updatedAsset.asset.properties["asset:prop:id"])
          .subscribe(() => this.assetService.createAsset(updatedAsset)
            .subscribe(() => this.fetch$.next(null)));
      }
    });
  }

  onDelete(asset: AssetDto) {
    this.assetService.removeAsset(asset.properties["asset:prop:id"])
      .subscribe(() => this.fetch$.next(null));
  }

  onCreate() {
    const dialogRef = this.dialog.open(AssetEditorDialog);
    dialogRef.afterClosed().pipe(first()).subscribe((result: { assetEntryDto?: AssetEntryDto }) => {
      const newAsset = result?.assetEntryDto;
      if (newAsset) {
        this.assetService.createAsset(newAsset).subscribe(() => this.fetch$.next(null));
      }
    });
  }
}
