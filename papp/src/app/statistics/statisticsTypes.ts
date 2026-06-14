export type DataType = "subjectTime" | "comparisonTime";
export type ChartType = "pie" | "bar";

export interface SubjectTimeDatum {
    name: string;
    minutes: number;
    fill: string;
}

export interface ComparisonDatum {
    name: string;
    planned: number;
    actual: number;
}

export type ChartState =
    | { kind: "subjectTime"; entries: SubjectTimeDatum[] }
    | { kind: "comparisonTime"; entries: ComparisonDatum[] };
