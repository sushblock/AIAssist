interface ECourtsCaseData {
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

interface ECourtsCauseListEntry {
  caseNumber: string;
  partyNames: string;
  court: string;
  judge: string;
  time: string;
  purpose: string;
  urgent?: boolean;
}

interface ECourtOrder {
  caseNumber: string;
  orderDate: string;
  orderText: string;
  nextHearingDate?: string;
  judge: string;
  court: string;
}

export class ECourtService {
  private readonly baseUrl = "https://eciapi.akshit.me";
  private readonly apiKey = process.env.ECOURTS_API_KEY || "";

  /**
   * Search case by CNR number using eCourts API
   */
  async searchByCNR(cnrNumber: string): Promise<ECourtsCaseData | null> {
    try {
      // Using E-Courts India API as per web search results
      const response = await fetch(`${this.baseUrl}/search/cnr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          cnr: cnrNumber
        })
      });

      if (!response.ok) {
        console.error(`eCourts API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      return {
        caseNumber: data.case_number || '',
        filingNumber: data.filing_number || '',
        caseStatus: data.case_status || '',
        petitioner: data.petitioner_name || '',
        respondent: data.respondent_name || '',
        nextHearingDate: data.next_hearing_date,
        lastOrderDate: data.last_order_date,
        courtName: data.court_name || '',
        judge: data.judge_name,
        caseType: data.case_type || '',
        filingDate: data.filing_date,
        stage: data.case_stage,
      };
    } catch (error) {
      console.error('Error searching eCourts by CNR:', error);
      return null;
    }
  }

  /**
   * Search case by case number and court
   */
  async searchByCaseNumber(caseNumber: string, court: string): Promise<ECourtsCaseData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/search/case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          case_number: caseNumber,
          court: court
        })
      });

      if (!response.ok) {
        console.error(`eCourts API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      return {
        caseNumber: data.case_number || '',
        filingNumber: data.filing_number || '',
        caseStatus: data.case_status || '',
        petitioner: data.petitioner_name || '',
        respondent: data.respondent_name || '',
        nextHearingDate: data.next_hearing_date,
        lastOrderDate: data.last_order_date,
        courtName: data.court_name || '',
        judge: data.judge_name,
        caseType: data.case_type || '',
        filingDate: data.filing_date,
        stage: data.case_stage,
      };
    } catch (error) {
      console.error('Error searching eCourts by case number:', error);
      return null;
    }
  }

  /**
   * Get today's cause list for a specific court
   */
  async getTodaysCauseList(court: string): Promise<ECourtsCauseListEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/causelist/today`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          court: court,
          date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        })
      });

      if (!response.ok) {
        console.error(`eCourts API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      return (data.entries || []).map((entry: any) => ({
        caseNumber: entry.case_number || '',
        partyNames: entry.party_names || '',
        court: entry.court || court,
        judge: entry.judge || '',
        time: entry.time || '',
        purpose: entry.purpose || '',
        urgent: entry.urgent_listing || false,
      }));
    } catch (error) {
      console.error('Error fetching cause list:', error);
      return [];
    }
  }

  /**
   * Get latest orders for a case
   */
  async getLatestOrders(cnrNumber: string): Promise<ECourtOrder[]> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${cnrNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        console.error(`eCourts API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      return (data.orders || []).map((order: any) => ({
        caseNumber: order.case_number || cnrNumber,
        orderDate: order.order_date || '',
        orderText: order.order_text || '',
        nextHearingDate: order.next_hearing_date,
        judge: order.judge || '',
        court: order.court || '',
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Search by party name
   */
  async searchByPartyName(partyName: string, court?: string): Promise<ECourtsCaseData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/party`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          party_name: partyName,
          court: court
        })
      });

      if (!response.ok) {
        console.error(`eCourts API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      return (data.cases || []).map((caseData: any) => ({
        caseNumber: caseData.case_number || '',
        filingNumber: caseData.filing_number || '',
        caseStatus: caseData.case_status || '',
        petitioner: caseData.petitioner_name || '',
        respondent: caseData.respondent_name || '',
        nextHearingDate: caseData.next_hearing_date,
        lastOrderDate: caseData.last_order_date,
        courtName: caseData.court_name || '',
        judge: caseData.judge_name,
        caseType: caseData.case_type || '',
        filingDate: caseData.filing_date,
        stage: caseData.case_stage,
      }));
    } catch (error) {
      console.error('Error searching by party name:', error);
      return [];
    }
  }

  /**
   * Check for case status updates since last check
   */
  async checkForUpdates(cnrNumbers: string[]): Promise<{cnr: string, hasUpdate: boolean, lastUpdate?: string}[]> {
    const results = [];
    
    for (const cnr of cnrNumbers) {
      try {
        const caseData = await this.searchByCNR(cnr);
        results.push({
          cnr,
          hasUpdate: !!caseData?.lastOrderDate,
          lastUpdate: caseData?.lastOrderDate
        });
      } catch (error) {
        console.error(`Error checking updates for ${cnr}:`, error);
        results.push({
          cnr,
          hasUpdate: false
        });
      }
    }
    
    return results;
  }
}

export const ecourtService = new ECourtService();
