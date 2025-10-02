import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ECourtsCaseData {
  caseNumber: string;
  filingNumber: string;
  caseStatus: string;
  petitioner: string;
  respondent: string;
  nextHearingDate?: string;
  lastOrderDate?: string;
  courtName: string;
  judge?: string;
  caseType: string;
  filingDate?: string;
  stage?: string;
}

export interface ECourtsCauseListEntry {
  caseNumber: string;
  partyNames: string;
  court: string;
  judge: string;
  time: string;
  purpose: string;
  urgent?: boolean;
}

export function useECourts() {
  const searchByCNRMutation = useMutation({
    mutationFn: async (cnrNumber: string): Promise<ECourtsCaseData | null> => {
      const response = await apiRequest("POST", "/api/ecourts/search/cnr", {
        cnrNumber
      });
      return response.json();
    },
  });

  const searchByCaseNumberMutation = useMutation({
    mutationFn: async (data: { caseNumber: string; court: string }): Promise<ECourtsCaseData | null> => {
      const response = await apiRequest("POST", "/api/ecourts/search/case", data);
      return response.json();
    },
  });

  const getCauseListQuery = (court: string) => useQuery({
    queryKey: ["/api/ecourts/causelist", court],
    queryFn: async (): Promise<ECourtsCauseListEntry[]> => {
      const response = await fetch(`/api/ecourts/causelist/${encodeURIComponent(court)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cause list: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!court,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const searchByPartyMutation = useMutation({
    mutationFn: async (data: { partyName: string; court?: string }): Promise<ECourtsCaseData[]> => {
      const response = await apiRequest("POST", "/api/ecourts/search/party", data);
      return response.json();
    },
  });

  const checkUpdatesQuery = (cnrNumbers: string[]) => useQuery({
    queryKey: ["/api/ecourts/check-updates", cnrNumbers],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/ecourts/check-updates", {
        cnrNumbers
      });
      return response.json();
    },
    enabled: cnrNumbers.length > 0,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  return {
    searchByCNR: searchByCNRMutation,
    searchByCaseNumber: searchByCaseNumberMutation,
    getCauseList: getCauseListQuery,
    searchByParty: searchByPartyMutation,
    checkUpdates: checkUpdatesQuery,
  };
}
