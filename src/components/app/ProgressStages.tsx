import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Stage = {
    label: string;
    completed: boolean;
};

type ProgressStagesProps = {
    stages: Stage[];
    title?: string;
};

export function ProgressStages({ stages, title = 'Progress Stages' }: ProgressStagesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {stages.map((stage, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${stage.completed
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                    }`}
                            >
                                {stage.completed ? '✓' : index + 1}
                            </div>
                            <div
                                className={`text-sm ${stage.completed
                                        ? 'text-gray-900 dark:text-gray-100 font-medium'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {stage.label}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
