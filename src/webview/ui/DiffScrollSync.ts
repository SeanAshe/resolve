import type { PaneDuo } from './PaneDuo';
import type { DiffSection } from './DiffSections';
import { GenericScrollSync } from './GenericScrollSync';

type DiffPaneId = 'head' | 'working';

const GUTTER_CELLS_BY_SIDE: Record<DiffPaneId, readonly string[]> = {
  head:    ['diff-space-l', 'diff-actions-revert', 'diff-ln-head'],
  working: ['diff-ln-working', 'diff-actions-stage', 'diff-space-r'],
};

/**
 * Diff view scroll sync. Thin wrapper around GenericScrollSync that
 * adapts diff sections (headLineCount / workingLineCount) into the
 * generic per-pane line count contract.
 */
export class DiffScrollSync {
  private readonly engine: GenericScrollSync<DiffPaneId>;

  constructor(
    duo: PaneDuo,
    lineHeight: number,
    onAfterScroll: () => void,
  ) {
    this.engine = new GenericScrollSync<DiffPaneId>(
      duo.group,
      GUTTER_CELLS_BY_SIDE,
      lineHeight,
      onAfterScroll,
    );
  }

  setSections(sections: DiffSection[]): void {
    this.engine.setSections(sections, (section) => ({
      // Collapsed context is one view row (the preview line). The model
      // still holds the full range; hidden areas remove the rest from
      // the scroll height, so the virtual scroller must follow the view.
      head: viewLineCount(section, 'head'),
      working: viewLineCount(section, 'working'),
    }));
  }

  recommit(): void {
    this.engine.recommit();
  }

  attach(): void {
    this.engine.attach();
  }

  setSyncEnabled(enabled: boolean): void {
    this.engine.setSyncEnabled(enabled);
  }

  scrollToSection(sectionIndex: number): void {
    const virtualY = this.engine.virtualStartOfSection(sectionIndex);
    if (virtualY === null) return;
    this.engine.scrollToVirtualY(virtualY);
  }

  currentSectionIndex(): number {
    return this.engine.currentSectionIndexForPane('working');
  }
}

function viewLineCount(section: DiffSection, pane: 'head' | 'working'): number {
  if (section.kind === 'ctx-collapsed') return 1;
  return pane === 'head' ? section.headLineCount : section.workingLineCount;
}
