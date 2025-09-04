"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenCheck, Loader2, Search, Sparkles, Trash2, UploadCloud, FileBadge, Quote, GraduationCap, BookText, Library, Users, Globe, Sigma, Waypoints, MessageSquareQuote, Puzzle, Languages, Blend, Scale, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getPdf, savePdf, clearPdfs as clearDbPdfs } from "@/lib/db";
import { extractInformation, ExtractInformationOutput } from "@/ai/flows/extract-information-from-pdf";
import { classifySubjectLevel, ClassifySubjectLevelOutput } from "@/ai/flows/classify-subject-level";
import { classifyDiscipline, ClassifyDisciplineOutput } from "@/ai/flows/classify-discipline";
import { classifySubDiscipline, ClassifySubDisciplineOutput } from "@/ai/flows/classify-sub-discipline";
import { classifyParticipantsGroup, ClassifyParticipantsGroupOutput } from "@/ai/flows/classify-participants-group";
import { classifyCountryRegion, ClassifyCountryRegionOutput } from "@/ai/flows/classify-country-region";
import { classifySampleSize, ClassifySampleSizeOutput } from "@/ai/flows/classify-sample-size";
import { classifyAiTechType, ClassifyAiTechTypeOutput } from "@/ai/flows/classify-ai-tech-type";
import { classifyEmiContext, ClassifyEmiContextOutput } from "@/ai/flows/classify-emi-context";
import { classifyInterventionRoles, ClassifyInterventionRolesOutput } from "@/ai/flows/classify-intervention-roles";
import { classifyRolesSkills, ClassifyRolesSkillsOutput } from "@/ai/flows/classify-roles-skills";
import { classifyIntegrationMode, ClassifyIntegrationModeOutput } from "@/ai/flows/classify-integration-mode";
import { classifyEthicsFocus, ClassifyEthicsFocusOutput } from "@/ai/flows/classify-ethics-focus";
import { classifyTeacherSupport, ClassifyTeacherSupportOutput } from "@/ai/flows/classify-teacher-support";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

const FormSchema = z.object({
  query: z.string().min(5, {
    message: "Query must be at least 5 characters.",
  }),
});

interface PdfData {
  name: string;
  dataUri: string;
  pages: string[];
}

export default function Home() {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchResult, setSearchResult] = useState<ExtractInformationOutput | null>(null);
  const [subjectLevel, setSubjectLevel] = useState<ClassifySubjectLevelOutput | null>(null);
  const [discipline, setDiscipline] = useState<ClassifyDisciplineOutput | null>(null);
  const [subDiscipline, setSubDiscipline] = useState<ClassifySubDisciplineOutput | null>(null);
  const [participantsGroup, setParticipantsGroup] = useState<ClassifyParticipantsGroupOutput | null>(null);
  const [countryRegion, setCountryRegion] = useState<ClassifyCountryRegionOutput | null>(null);
  const [sampleSize, setSampleSize] = useState<ClassifySampleSizeOutput | null>(null);
  const [aiTechType, setAiTechType] = useState<ClassifyAiTechTypeOutput | null>(null);
  const [emiContext, setEmiContext] = useState<ClassifyEmiContextOutput | null>(null);
  const [interventionRoles, setInterventionRoles] = useState<ClassifyInterventionRolesOutput | null>(null);
  const [rolesSkills, setRolesSkills] = useState<ClassifyRolesSkillsOutput | null>(null);
  const [integrationMode, setIntegrationMode] = useState<ClassifyIntegrationModeOutput | null>(null);
  const [ethicsFocus, setEthicsFocus] = useState<ClassifyEthicsFocusOutput | null>(null);
  const [teacherSupport, setTeacherSupport] = useState<ClassifyTeacherSupportOutput | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isClassifyingDiscipline, setIsClassifyingDiscipline] = useState(false);
  const [isClassifyingSubDiscipline, setIsClassifyingSubDiscipline] = useState(false);
  const [isClassifyingParticipantsGroup, setIsClassifyingParticipantsGroup] = useState(false);
  const [isClassifyingCountryRegion, setIsClassifyingCountryRegion] = useState(false);
  const [isClassifyingSampleSize, setIsClassifyingSampleSize] = useState(false);
  const [isClassifyingAiTechType, setIsClassifyingAiTechType] = useState(false);
  const [isClassifyingEmiContext, setIsClassifyingEmiContext] = useState(false);
  const [isClassifyingInterventionRoles, setIsClassifyingInterventionRoles] = useState(false);
  const [isClassifyingRolesSkills, setIsClassifyingRolesSkills] = useState(false);
  const [isClassifyingIntegrationMode, setIsClassifyingIntegrationMode] = useState(false);
  const [isClassifyingEthicsFocus, setIsClassifyingEthicsFocus] = useState(false);
  const [isClassifyingTeacherSupport, setIsClassifyingTeacherSupport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { query: "" },
  });

  const extractTextFromDataUri = useCallback(async (dataUri: string): Promise<string[]> => {
    const pdf = await pdfjs.getDocument({ data: atob(dataUri.split(',')[1]) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(" ");
      pages.push(`Page ${i}: ${pageText}`);
    }
    return pages;
  }, []);

  const loadPdfFromDb = useCallback(async () => {
    try {
      const storedPdf = await getPdf();
      if (storedPdf) {
        setIsLoading(true);
        const pages = await extractTextFromDataUri(storedPdf.dataUri);
        setPdfData({ name: storedPdf.name, dataUri: storedPdf.dataUri, pages });
      }
    } catch (error) {
      console.error("Failed to load PDF from DB", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load previously saved PDF." });
      await clearDbPdfs();
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  }, [toast, extractTextFromDataUri]);
  
  useEffect(() => {
    loadPdfFromDb();
  }, [loadPdfFromDb]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setIsLoading(true);
      setSearchResult(null);
      setSubjectLevel(null);
      setDiscipline(null);
      setSubDiscipline(null);
      setParticipantsGroup(null);
      setCountryRegion(null);
      setSampleSize(null);
      setAiTechType(null);
      setEmiContext(null);
      setInterventionRoles(null);
      setRolesSkills(null);
      setIntegrationMode(null);
      setEthicsFocus(null);
      setTeacherSupport(null);
      form.reset();
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUri = e.target?.result as string;
          const pages = await extractTextFromDataUri(dataUri);
          setPdfData({ name: file.name, dataUri, pages });
          await savePdf('current_pdf', file.name, dataUri);
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to process PDF", error);
        toast({ variant: "destructive", title: "Error", description: "Could not process the PDF file." });
        setIsLoading(false);
      }
    } else if (file) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload a valid PDF file." });
    }
  };

  const clearPdf = async () => {
    setPdfData(null);
    setSearchResult(null);
    setSubjectLevel(null);
    setDiscipline(null);
    setSubDiscipline(null);
    setParticipantsGroup(null);
    setCountryRegion(null);
    setSampleSize(null);
    setAiTechType(null);
    setEmiContext(null);
    setInterventionRoles(null);
    setRolesSkills(null);
    setIntegrationMode(null);
    setEthicsFocus(null);
    setTeacherSupport(null);
    form.reset();
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    await clearDbPdfs();
    toast({ title: "Success", description: "PDF has been cleared." });
  };
  
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to search." });
        return;
    }
    setIsLoading(true);
    setSearchResult(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await extractInformation({ pdfText, query: data.query });
        setSearchResult(result);
    } catch (error) {
        console.error("AI extraction failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to extract information. Please try again." });
    } finally {
        setIsLoading(false);
    }
  }

  const handleClassify = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifying(true);
    setSubjectLevel(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifySubjectLevel({ pdfText });
        setSubjectLevel(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify subject level. Please try again." });
    } finally {
        setIsClassifying(false);
    }
  }

  const handleClassifyDiscipline = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingDiscipline(true);
    setDiscipline(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyDiscipline({ pdfText });
        setDiscipline(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify discipline. Please try again." });
    } finally {
        setIsClassifyingDiscipline(false);
    }
  }

  const handleClassifySubDiscipline = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingSubDiscipline(true);
    setSubDiscipline(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifySubDiscipline({ pdfText });
        setSubDiscipline(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify sub-discipline. Please try again." });
    } finally {
        setIsClassifyingSubDiscipline(false);
    }
  }

  const handleClassifyParticipantsGroup = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingParticipantsGroup(true);
    setParticipantsGroup(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyParticipantsGroup({ pdfText });
        setParticipantsGroup(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify participants group. Please try again." });
    } finally {
        setIsClassifyingParticipantsGroup(false);
    }
  }

  const handleClassifyCountryRegion = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingCountryRegion(true);
    setCountryRegion(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyCountryRegion({ pdfText });
        setCountryRegion(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify country or region. Please try again." });
    } finally {
        setIsClassifyingCountryRegion(false);
    }
  }

  const handleClassifySampleSize = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingSampleSize(true);
    setSampleSize(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifySampleSize({ pdfText });
        setSampleSize(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify sample size. Please try again." });
    } finally {
        setIsClassifyingSampleSize(false);
    }
  }

  const handleClassifyAiTechType = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingAiTechType(true);
    setAiTechType(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyAiTechType({ pdfText });
        setAiTechType(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify AI tech type. Please try again." });
    } finally {
        setIsClassifyingAiTechType(false);
    }
  }

  const handleClassifyEmiContext = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingEmiContext(true);
    setEmiContext(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyEmiContext({ pdfText });
        setEmiContext(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify EMI context. Please try again." });
    } finally {
        setIsClassifyingEmiContext(false);
    }
  }

  const handleClassifyInterventionRoles = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingInterventionRoles(true);
    setInterventionRoles(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyInterventionRoles({ pdfText });
        setInterventionRoles(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify intervention roles. Please try again." });
    } finally {
        setIsClassifyingInterventionRoles(false);
    }
  }

  const handleClassifyRolesSkills = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingRolesSkills(true);
    setRolesSkills(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyRolesSkills({ pdfText });
        setRolesSkills(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify roles skills. Please try again." });
    } finally {
        setIsClassifyingRolesSkills(false);
    }
  }

  const handleClassifyIntegrationMode = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingIntegrationMode(true);
    setIntegrationMode(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyIntegrationMode({ pdfText });
        setIntegrationMode(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify integration mode. Please try again." });
    } finally {
        setIsClassifyingIntegrationMode(false);
    }
  }

  const handleClassifyEthicsFocus = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingEthicsFocus(true);
    setEthicsFocus(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyEthicsFocus({ pdfText });
        setEthicsFocus(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify ethics focus. Please try again." });
    } finally {
        setIsClassifyingEthicsFocus(false);
    }
  }

  const handleClassifyTeacherSupport = async () => {
    if (!pdfData?.pages || pdfData.pages.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to classify." });
        return;
    }
    setIsClassifyingTeacherSupport(true);
    setTeacherSupport(null);
    try {
        const pdfText = pdfData.pages.join('\n\n');
        const result = await classifyTeacherSupport({ pdfText });
        setTeacherSupport(result);
    } catch (error) {
        console.error("AI classification failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to classify teacher support. Please try again." });
    } finally {
        setIsClassifyingTeacherSupport(false);
    }
  }

  const anyLoading = isLoading || isClassifying || isClassifyingDiscipline || isClassifyingSubDiscipline || isClassifyingParticipantsGroup || isClassifyingCountryRegion || isClassifyingSampleSize || isClassifyingAiTechType || isClassifyingEmiContext || isClassifyingInterventionRoles || isClassifyingRolesSkills || isClassifyingIntegrationMode || isClassifyingEthicsFocus || isClassifyingTeacherSupport;

  if (isInitializing) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-8 text-center">
        <h1 className="font-headline text-5xl font-bold text-primary">ScholarLens</h1>
        <p className="mt-2 text-lg text-muted-foreground">Your AI-powered research assistant for PDF analysis.</p>
      </header>
      
      <main className="container mx-auto max-w-7xl px-4 pb-16">
        {!pdfData ? (
          <Card 
            className="flex h-[400px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-muted-foreground/50 bg-card transition-colors hover:border-primary hover:bg-accent/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardHeader className="items-center text-center">
              <UploadCloud className="h-16 w-16 text-primary" />
              <CardTitle className="mt-4 font-headline text-2xl">Upload your Research Paper</CardTitle>
              <CardDescription>Click here or drag and drop a PDF file to begin.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isLoading}/>
              {isLoading && <div className="mt-4 flex items-center gap-2 text-primary"><Loader2 className="animate-spin" /> <span>Processing PDF...</span></div>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
            <Card className="overflow-hidden lg:sticky lg:top-8 h-[calc(100vh-4rem)]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <BookOpenCheck className="h-6 w-6 flex-shrink-0 text-primary" />
                        <CardTitle className="font-headline truncate text-xl" title={pdfData.name}>{pdfData.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearPdf}>
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Clear PDF</span>
                    </Button>
                </CardHeader>
                <CardContent className="h-full p-0">
                    <iframe src={pdfData.dataUri} className="h-[calc(100%-72px)] w-full" title={pdfData.name} />
                </CardContent>
            </Card>

            <div className="flex flex-col gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-2xl"><Search className="text-primary"/> Ask your document</CardTitle>
                  <CardDescription>Enter a query to find specific information in the PDF.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g., What were the main findings of the study?" {...field} disabled={anyLoading}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={anyLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Find Information
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="min-h-[200px]">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2 text-2xl"><Sparkles className="text-accent"/> AI Insights</CardTitle>
                    <CardDescription>The extracted information will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && searchResult === null ? (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-[80%]" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-4 w-[75%]" />
                        </div>
                    ) : searchResult ? (
                        <div className="space-y-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                                {searchResult.extractedInformation}
                            </div>
                            {searchResult.sources && searchResult.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {searchResult.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No query submitted yet.</p>
                    )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><GraduationCap className="text-primary"/> Subject Level</div>
                      <Button size="sm" onClick={handleClassify} disabled={anyLoading}>
                        {isClassifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the educational level of the research subjects.</CardDescription>
                </CardHeader>
                { (isClassifying || subjectLevel) &&
                <CardContent>
                    {isClassifying ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subjectLevel ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{subjectLevel.level}</Badge>
                            </div>

                            {subjectLevel.sources && subjectLevel.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {subjectLevel.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>
              
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><BookText className="text-primary"/> Discipline</div>
                      <Button size="sm" onClick={handleClassifyDiscipline} disabled={anyLoading}>
                        {isClassifyingDiscipline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the discipline of the research paper.</CardDescription>
                </CardHeader>
                { (isClassifyingDiscipline || discipline) &&
                <CardContent>
                    {isClassifyingDiscipline ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : discipline ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{discipline.discipline}</Badge>
                            </div>

                            {discipline.sources && discipline.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {discipline.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Library className="text-primary"/> Sub-discipline</div>
                      <Button size="sm" onClick={handleClassifySubDiscipline} disabled={anyLoading}>
                        {isClassifyingSubDiscipline ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the sub-discipline of the research paper.</CardDescription>
                </CardHeader>
                { (isClassifyingSubDiscipline || subDiscipline) &&
                <CardContent>
                    {isClassifyingSubDiscipline ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subDiscipline ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{subDiscipline.subDiscipline}</Badge>
                            </div>

                            {subDiscipline.sources && subDiscipline.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {subDiscipline.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Users className="text-primary"/> Participants Group</div>
                      <Button size="sm" onClick={handleClassifyParticipantsGroup} disabled={anyLoading}>
                        {isClassifyingParticipantsGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the group of research participants.</CardDescription>
                </CardHeader>
                { (isClassifyingParticipantsGroup || participantsGroup) &&
                <CardContent>
                    {isClassifyingParticipantsGroup ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : participantsGroup ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{participantsGroup.participantsGroup}</Badge>
                            </div>

                            {participantsGroup.sources && participantsGroup.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {participantsGroup.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Globe className="text-primary"/> Country or Region</div>
                      <Button size="sm" onClick={handleClassifyCountryRegion} disabled={anyLoading}>
                        {isClassifyingCountryRegion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the country or region of the research participants.</CardDescription>
                </CardHeader>
                { (isClassifyingCountryRegion || countryRegion) &&
                <CardContent>
                    {isClassifyingCountryRegion ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : countryRegion ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{countryRegion.countryOrRegion}</Badge>
                            </div>

                            {countryRegion.sources && countryRegion.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {countryRegion.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Sigma className="text-primary"/> Sample Size</div>
                      <Button size="sm" onClick={handleClassifySampleSize} disabled={anyLoading}>
                        {isClassifyingSampleSize ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the sample size (N) of the research participants.</CardDescription>
                </CardHeader>
                { (isClassifyingSampleSize || sampleSize) &&
                <CardContent>
                    {isClassifyingSampleSize ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : sampleSize ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">N = {sampleSize.sampleSize}</Badge>
                            </div>

                            {sampleSize.sources && sampleSize.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {sampleSize.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Waypoints className="text-primary"/> AI Tech Type</div>
                      <Button size="sm" onClick={handleClassifyAiTechType} disabled={anyLoading}>
                        {isClassifyingAiTechType ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the type(s) of AI technology used in the paper.</CardDescription>
                </CardHeader>
                { (isClassifyingAiTechType || aiTechType) &&
                <CardContent>
                    {isClassifyingAiTechType ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : aiTechType ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{aiTechType.aiTechType}</Badge>
                            </div>

                            {aiTechType.sources && aiTechType.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {aiTechType.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><MessageSquareQuote className="text-primary"/> EMI Context</div>
                      <Button size="sm" onClick={handleClassifyEmiContext} disabled={anyLoading}>
                        {isClassifyingEmiContext ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the EMI (English as a Medium of Instruction) context.</CardDescription>
                </CardHeader>
                { (isClassifyingEmiContext || emiContext) &&
                <CardContent>
                    {isClassifyingEmiContext ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : emiContext ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{emiContext.emiContext}</Badge>
                            </div>

                            {emiContext.sources && emiContext.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {emiContext.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Puzzle className="text-primary"/> Intervention Roles</div>
                      <Button size="sm" onClick={handleClassifyInterventionRoles} disabled={anyLoading}>
                        {isClassifyingInterventionRoles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the roles or benefits of AI intervention for research subjects.</CardDescription>
                </CardHeader>
                { (isClassifyingInterventionRoles || interventionRoles) &&
                <CardContent>
                    {isClassifyingInterventionRoles ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : interventionRoles ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{interventionRoles.interventionRoles}</Badge>
                            </div>

                            {interventionRoles.sources && interventionRoles.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {interventionRoles.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Languages className="text-primary"/> Roles Skills</div>
                      <Button size="sm" onClick={handleClassifyRolesSkills} disabled={anyLoading}>
                        {isClassifyingRolesSkills ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the language skills targeted or supported by AI.</CardDescription>
                </CardHeader>
                { (isClassifyingRolesSkills || rolesSkills) &&
                <CardContent>
                    {isClassifyingRolesSkills ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : rolesSkills ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{rolesSkills.rolesSkills}</Badge>
                            </div>

                            {rolesSkills.sources && rolesSkills.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {rolesSkills.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Blend className="text-primary"/> Integration Mode</div>
                      <Button size="sm" onClick={handleClassifyIntegrationMode} disabled={anyLoading}>
                        {isClassifyingIntegrationMode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the mode of AI integration in the paper.</CardDescription>
                </CardHeader>
                { (isClassifyingIntegrationMode || integrationMode) &&
                <CardContent>
                    {isClassifyingIntegrationMode ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : integrationMode ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{integrationMode.integrationMode}</Badge>
                            </div>

                            {integrationMode.sources && integrationMode.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {integrationMode.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><Scale className="text-primary"/> Ethics Focus</div>
                      <Button size="sm" onClick={handleClassifyEthicsFocus} disabled={anyLoading}>
                        {isClassifyingEthicsFocus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the ethical focus(es) of AI intervention in the paper.</CardDescription>
                </CardHeader>
                { (isClassifyingEthicsFocus || ethicsFocus) &&
                <CardContent>
                    {isClassifyingEthicsFocus ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : ethicsFocus ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{ethicsFocus.ethicsFocus}</Badge>
                            </div>

                            {ethicsFocus.sources && ethicsFocus.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {ethicsFocus.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>
              
              <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center justify-between text-2xl">
                      <div className="flex items-center gap-2"><LifeBuoy className="text-primary"/> Teacher Support</div>
                      <Button size="sm" onClick={handleClassifyTeacherSupport} disabled={anyLoading}>
                        {isClassifyingTeacherSupport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Classify
                      </Button>
                    </CardTitle>
                    <CardDescription>Identify the types of teacher support provided or mentioned.</CardDescription>
                </CardHeader>
                { (isClassifyingTeacherSupport || teacherSupport) &&
                <CardContent>
                    {isClassifyingTeacherSupport ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : teacherSupport ? (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <Badge variant="secondary" className="text-lg">{teacherSupport.teacherSupport}</Badge>
                            </div>

                            {teacherSupport.sources && teacherSupport.sources.length > 0 && (
                                <>
                                    <Separator/>
                                    <div className="space-y-4 pt-4">
                                        {teacherSupport.sources.map((source, index) => (
                                          <div key={index} className="space-y-2">
                                            {source.text && (
                                                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                                    <Quote className="h-4 w-4 flex-shrink-0 text-accent mt-1" />
                                                    <blockquote className="border-l-2 border-accent pl-3 italic">
                                                        {source.text}
                                                    </blockquote>
                                                </div>
                                            )}
                                            {source.page && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <FileBadge className="h-4 w-4 text-accent" />
                                                    <span>Source: Page {source.page}</span>
                                                </div>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </CardContent>
                }
              </Card>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
