"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenCheck, Loader2, Search, Sparkles, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getPdf, savePdf, clearPdfs as clearDbPdfs } from "@/lib/db";
import { extractInformation } from "@/ai/flows/extract-information-from-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

const FormSchema = z.object({
  query: z.string().min(5, {
    message: "Query must be at least 5 characters.",
  }),
});

interface PdfData {
  name: string;
  dataUri: string;
  text: string;
}

export default function Home() {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { query: "" },
  });

  const extractTextFromDataUri = useCallback(async (dataUri: string): Promise<string> => {
    const pdf = await pdfjs.getDocument({ data: atob(dataUri.split(',')[1]) }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(" ") + "\n";
    }
    return fullText;
  }, []);

  const loadPdfFromDb = useCallback(async () => {
    try {
      const storedPdf = await getPdf();
      if (storedPdf) {
        setIsLoading(true);
        const text = await extractTextFromDataUri(storedPdf.dataUri);
        setPdfData({ name: storedPdf.name, dataUri: storedPdf.dataUri, text });
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
      form.reset();
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUri = e.target?.result as string;
          const text = await extractTextFromDataUri(dataUri);
          setPdfData({ name: file.name, dataUri, text });
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
    form.reset();
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    await clearDbPdfs();
    toast({ title: "Success", description: "PDF has been cleared." });
  };
  
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!pdfData?.text) {
        toast({ variant: "destructive", title: "Error", description: "No PDF text available to search." });
        return;
    }
    setIsLoading(true);
    setSearchResult(null);
    try {
        const result = await extractInformation({ pdfText: pdfData.text, query: data.query });
        setSearchResult(result.extractedInformation);
    } catch (error) {
        console.error("AI extraction failed", error);
        toast({ variant: "destructive", title: "AI Error", description: "Failed to extract information. Please try again." });
    } finally {
        setIsLoading(false);
    }
  }

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
            <Card className="overflow-hidden lg:sticky lg:top-8">
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
                <CardContent className="h-[700px] p-0">
                    <embed src={pdfData.dataUri} type="application/pdf" width="100%" height="100%" />
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
                              <Input placeholder="e.g., What were the main findings of the study?" {...field} disabled={isLoading}/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
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
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                          {searchResult}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">No query submitted yet.</p>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
