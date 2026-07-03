export type CmdkVectorizedIntent = {
  recordType: string;
  section: string;
  commandId: string;
  label: string;
  path?: string;
  phrases: string[];
  keywords: string[];
  setValue?: string;
  description: string;
  actionType: string;
  stateKey?: string;
};

export type InstallAgentWorkflowsOptions = {
  cwd: string;
};

export type UploadIntentMapOptions = {
  cwd: string;
  fetcher?: typeof fetch;
  env?: Record<string, string | undefined>;
};

export type UploadIntentMapResult = {
  collectionCreated: boolean;
  uploadedCount: number;
};
