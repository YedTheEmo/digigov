import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__helpers__/test-utils';
import { ProgressStages, type Stage } from '@/components/app/ProgressStages';

describe('ProgressStages', () => {
  const mockStages: Stage[] = [
    { label: 'Stage 1', completed: true },
    { label: 'Stage 2', completed: true },
    { label: 'Stage 3', completed: false },
    { label: 'Stage 4', completed: false },
  ];

  it('renders with default title', () => {
    render(<ProgressStages stages={mockStages} />);
    expect(screen.getByText('Progress Stages')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<ProgressStages stages={mockStages} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders all stages', () => {
    render(<ProgressStages stages={mockStages} />);
    expect(screen.getByText('Stage 1')).toBeInTheDocument();
    expect(screen.getByText('Stage 2')).toBeInTheDocument();
    expect(screen.getByText('Stage 3')).toBeInTheDocument();
    expect(screen.getByText('Stage 4')).toBeInTheDocument();
  });

  it('shows checkmark for completed stages', () => {
    render(<ProgressStages stages={mockStages} />);
    
    // Test the content users see - the checkmark should be present
    const allStageElements = screen.getAllByText(/Stage \d/);
    const stage1Container = allStageElements[0].parentElement;
    
    expect(stage1Container).toHaveTextContent('✓');
    expect(stage1Container).toHaveTextContent('Stage 1');
  });

  it('shows number for incomplete stages', () => {
    render(<ProgressStages stages={mockStages} />);
    
    const stage3Container = screen.getByText('Stage 3').parentElement;
    expect(stage3Container).toHaveTextContent('3');
    expect(stage3Container).not.toHaveTextContent('✓');
  });

  it('applies correct styling to completed stages', () => {
    render(<ProgressStages stages={mockStages} />);
    
    const stage1 = screen.getByText('Stage 1');
    expect(stage1).toHaveClass('font-medium');
  });

  it('applies correct styling to incomplete stages', () => {
    render(<ProgressStages stages={mockStages} />);
    
    const stage3 = screen.getByText('Stage 3');
    expect(stage3).not.toHaveClass('font-medium');
  });

  it('renders empty stages array', () => {
    render(<ProgressStages stages={[]} />);
    expect(screen.getByText('Progress Stages')).toBeInTheDocument();
    expect(screen.queryByText(/Stage \d/)).not.toBeInTheDocument();
  });

  it('renders single stage', () => {
    const singleStage: Stage[] = [{ label: 'Only Stage', completed: true }];
    render(<ProgressStages stages={singleStage} />);
    expect(screen.getByText('Only Stage')).toBeInTheDocument();
  });

  it('shows correct stage numbers for incomplete stages', () => {
    render(<ProgressStages stages={mockStages} />);
    
    // Stage 3 is at index 2, should show "3"
    const stage3 = screen.getByText('Stage 3').closest('div');
    expect(stage3?.textContent).toContain('3');
    
    // Stage 4 is at index 3, should show "4"
    const stage4 = screen.getByText('Stage 4').closest('div');
    expect(stage4?.textContent).toContain('4');
  });

  it('renders all stages as completed', () => {
    const allCompleted: Stage[] = [
      { label: 'Stage 1', completed: true },
      { label: 'Stage 2', completed: true },
      { label: 'Stage 3', completed: true },
    ];
    
    render(<ProgressStages stages={allCompleted} />);
    
    allCompleted.forEach((stage) => {
      const stageElement = screen.getByText(stage.label).parentElement;
      expect(stageElement).toHaveTextContent('✓');
    });
  });

  it('renders all stages as incomplete', () => {
    const allIncomplete: Stage[] = [
      { label: 'Stage 1', completed: false },
      { label: 'Stage 2', completed: false },
    ];
    
    render(<ProgressStages stages={allIncomplete} />);
    
    allIncomplete.forEach((stage, index) => {
      const stageElement = screen.getByText(stage.label).closest('div');
      expect(stageElement?.textContent).toContain(String(index + 1));
    });
  });
});

