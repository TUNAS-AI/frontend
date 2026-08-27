import type { MissionService } from "../../features/missions/types";
import { MockMissionService } from "./mockSupport/MockMissionService";
import { DEMO_CONTEXT, REFERENCE_INPUT } from "./mockSupport/demoMissionData";
import { DEMO_MISSIONS_LIST_DATA } from "./mockSupport/demoMissionsListData";
import { getDemoMissionDetail } from "./mockSupport/demoMissionDetailData";

// Phase 4 deliberately selects the in-process demo. Any future transport must be implemented explicitly.
const transport = import.meta.env.VITE_MISSION_TRANSPORT as string | undefined;

class UnconfiguredMissionService implements MissionService {
  private readonly transportName: string | undefined;

  constructor(transportName: string | undefined) {
    this.transportName = transportName;
  }

  private fail(): Promise<never> {
    return Promise.reject(
      new Error(
        `Mission demo is not configured. Set VITE_MISSION_TRANSPORT=demo before using the mission flow${this.transportName ? ` (received: ${this.transportName})` : ""}.`,
      ),
    );
  }

  createDraft() { return this.fail(); }
  interpret() { return this.fail(); }
  checkpoint() { return this.fail(); }
  plan() { return this.fail(); }
  recalculate() { return this.fail(); }
  preview() { return this.fail(); }
  submit() { return this.fail(); }
}

function createMissionApi(): MissionService {
  if (transport === "demo") return new MockMissionService();
  return new UnconfiguredMissionService(transport);
}

export const missionApi = createMissionApi();
export const missionDemoContext = DEMO_CONTEXT;
export const missionReferenceInput = REFERENCE_INPUT;
export const missionsListPlaceholderData = DEMO_MISSIONS_LIST_DATA;
export { getDemoMissionDetail };
