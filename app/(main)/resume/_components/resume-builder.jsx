"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/user-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";

// React-PDF imports
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink, 
  pdf,
  Font 
} from '@react-pdf/renderer';

// ✅ FIXED: Use system fonts (no external loading required)
// This prevents "unknown font format" errors
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica', // System font - always works
    fontSize: 11,
    lineHeight: 1.5,
    color: '#333333',
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '2 solid #2563eb',
  },
  name: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold', // Bold system font
    color: '#1e293b',
    marginBottom: 8,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
  },
  contactItem: {
    fontSize: 10,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1 solid #e2e8f0',
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'justify',
    lineHeight: 1.6,
  },
  experienceItem: {
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  company: {
    fontSize: 11,
    color: '#2563eb',
    fontFamily: 'Helvetica-Oblique', // Italic system font
  },
  duration: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'Helvetica-Oblique',
  },
  description: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginTop: 4,
  },
  skillsText: {
    fontSize: 11,
    lineHeight: 1.6,
  },
});

// ✅ PDF Document Component
const ResumePDF = ({ resumeData, user }) => {
  const formatContactInfo = () => {
    const contacts = [];
    if (resumeData.contactInfo?.email) contacts.push(`📧 ${resumeData.contactInfo.email}`);
    if (resumeData.contactInfo?.mobile) contacts.push(`📱 ${resumeData.contactInfo.mobile}`);
    if (resumeData.contactInfo?.linkedin) contacts.push(`💼 LinkedIn`);
    if (resumeData.contactInfo?.twitter) contacts.push(`🐦 Twitter`);
    return contacts;
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header Section */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.name}>{user?.fullName || 'Your Name'}</Text>
          <View style={pdfStyles.contactContainer}>
            {formatContactInfo().map((contact, index) => (
              <Text key={index} style={pdfStyles.contactItem}>
                {contact}
              </Text>
            ))}
          </View>
        </View>

        {/* Professional Summary */}
        {resumeData.summary && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Professional Summary</Text>
            <Text style={pdfStyles.paragraph}>{resumeData.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {resumeData.skills && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Skills</Text>
            <Text style={pdfStyles.skillsText}>{resumeData.skills}</Text>
          </View>
        )}

        {/* Work Experience */}
        {resumeData.experience?.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Work Experience</Text>
            {resumeData.experience.map((exp, index) => (
              <View key={index} style={pdfStyles.experienceItem}>
                <Text style={pdfStyles.jobTitle}>{exp.title || 'Job Title'}</Text>
                <View style={pdfStyles.companyInfo}>
                  <Text style={pdfStyles.company}>{exp.company || 'Company Name'}</Text>
                  {exp.duration && (
                    <Text style={pdfStyles.duration}>{exp.duration}</Text>
                  )}
                </View>
                {exp.description && (
                  <Text style={pdfStyles.description}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resumeData.education?.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Education</Text>
            {resumeData.education.map((edu, index) => (
              <View key={index} style={pdfStyles.experienceItem}>
                <Text style={pdfStyles.jobTitle}>{edu.degree || edu.title}</Text>
                <View style={pdfStyles.companyInfo}>
                  <Text style={pdfStyles.company}>{edu.institution || edu.company}</Text>
                  {edu.duration && (
                    <Text style={pdfStyles.duration}>{edu.duration}</Text>
                  )}
                </View>
                {edu.description && (
                  <Text style={pdfStyles.description}>{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {resumeData.projects?.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Projects</Text>
            {resumeData.projects.map((project, index) => (
              <View key={index} style={pdfStyles.experienceItem}>
                <Text style={pdfStyles.jobTitle}>{project.title}</Text>
                {project.duration && (
                  <Text style={pdfStyles.duration}>{project.duration}</Text>
                )}
                {project.description && (
                  <Text style={pdfStyles.description}>{project.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

// ✅ Main Resume Builder Component
export default function ResumeBuilder({ initialContent = "" }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { user } = useUser();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {
        email: "",
        mobile: "",
        linkedin: "",
        twitter: "",
      },
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  const getContactMarkdown = useCallback(() => {
    if (!user?.fullName) return "";
    
    const { contactInfo } = formValues;
    const parts = [];
    
    if (contactInfo?.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo?.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo?.linkedin) parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo?.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user.fullName}</div>\n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : `## <div align="center">${user.fullName}</div>`;
  }, [user?.fullName, formValues.contactInfo]);

  const getCombinedContent = useCallback(() => {
    const { summary, skills, experience, education, projects } = formValues;
    
    const sections = [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      experience?.length > 0 && entriesToMarkdown(experience, "Work Experience"),
      education?.length > 0 && entriesToMarkdown(education, "Education"),
      projects?.length > 0 && entriesToMarkdown(projects, "Projects"),
    ].filter(Boolean);

    return sections.length > 0 ? sections.join("\n\n") : "";
  }, [formValues, getContactMarkdown]);

  useEffect(() => {
    if (initialContent && initialContent.trim()) {
      setActiveTab("preview");
      setPreviewContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      const contentToSet = newContent || initialContent || "";
      setPreviewContent(contentToSet);
    }
  }, [formValues, activeTab, getCombinedContent, initialContent]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
  }, [saveResult, isSaving]);

  useEffect(() => {
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveError]);

  // ✅ FIXED: PDF Generation with better error handling
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      console.log("Starting PDF generation...");
      
      const doc = <ResumePDF resumeData={formValues} user={user} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      console.log("PDF blob created successfully");
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${user?.fullName?.replace(/\s+/g, '_') || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF generated and downloaded successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (!previewContent || previewContent.trim() === "") {
        toast.error("No content to save");
        return;
      }

      const formattedContent = previewContent
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();

      await saveResumeFn(formattedContent);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save resume");
    }
  };

  const handlePreviewContentChange = (value) => {
    if (typeof value === 'string') {
      setPreviewContent(value);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div data-color-mode="light" className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !previewContent?.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
          
          {/* ✅ FIXED: Direct PDF Download Button */}
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating || !previewContent?.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>

          {/* ✅ FIXED: Alternative PDFDownloadLink */}
          <PDFDownloadLink
            document={<ResumePDF resumeData={formValues} user={user} />}
            fileName={`${user?.fullName?.replace(/\s+/g, '_') || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ blob, url, loading, error }) => (
              <Button 
                disabled={loading || !previewContent?.trim()}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Quick PDF
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">
            <Edit className="mr-2 h-4 w-4" />
            Form
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Monitor className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Twitter/X Profile</label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.twitter.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="min-h-32"
                    placeholder="Write a compelling professional summary..."
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="min-h-32"
                    placeholder="List your key skills (e.g., React, Node.js, Python)..."
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value || []}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value || []}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Project"
                    entries={field.value || []}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <div className="mb-4">
              <Button
                variant="outline"
                type="button"
                onClick={() =>
                  setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                }
              >
                {resumeMode === "preview" ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Markdown
                  </>
                ) : (
                  <>
                    <Monitor className="mr-2 h-4 w-4" />
                    Show Preview
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === "preview" && resumeMode === "edit" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-500 bg-yellow-50 text-yellow-700 rounded mb-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">
                Warning: Manual edits will be overwritten if you update the form data.
              </span>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <MDEditor
              value={previewContent}
              onChange={handlePreviewContentChange}
              height={800}
              preview={resumeMode}
              data-color-mode="light"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}