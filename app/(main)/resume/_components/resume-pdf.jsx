import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Link
} from '@react-pdf/renderer';

// Professional resume styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2937',
  },
  
  // Header Section
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #3b82f6',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  contactItem: {
    fontSize: 9,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  contactLink: {
    color: '#3b82f6',
    textDecoration: 'none',
  },
  
  // Section Styles
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1pt solid #d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Content Styles
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'justify',
    lineHeight: 1.5,
    color: '#374151',
  },
  
  // Experience/Education/Project Item
  entryItem: {
    marginBottom: 14,
  },
  entryTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  entryOrganization: {
    fontSize: 10,
    color: '#3b82f6',
    fontFamily: 'Helvetica-Oblique',
  },
  entryDuration: {
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Helvetica-Oblique',
  },
  entryDescription: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.5,
    marginTop: 4,
  },
  
  // Skills Section
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillItem: {
    fontSize: 9,
    color: '#374151',
    marginRight: 4,
    marginBottom: 4,
  },
  
  // Bullet Points
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 15,
    fontSize: 9,
    color: '#6b7280',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
});

// Helper function to format contact info
const formatContactInfo = (contactInfo) => {
  const contacts = [];
  if (contactInfo?.email) contacts.push({ text: contactInfo.email, type: 'email' });
  if (contactInfo?.mobile) contacts.push({ text: contactInfo.mobile, type: 'phone' });
  if (contactInfo?.linkedin) contacts.push({ text: 'LinkedIn', url: contactInfo.linkedin });
  if (contactInfo?.twitter) contacts.push({ text: 'Twitter', url: contactInfo.twitter });
  return contacts;
};

// Helper to parse description into bullet points
const parseDescription = (description) => {
  if (!description) return [];
  
  // Split by common bullet point markers or newlines
  const lines = description
    .split(/\n|•|●|·|-\s/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return lines;
};

export const ResumePDF = ({ resumeData, user }) => {
  const contacts = formatContactInfo(resumeData?.contactInfo);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {user?.fullName || 'Your Name'}
          </Text>
          <View style={styles.contactRow}>
            {contacts.map((contact, index) => (
              <Text key={index} style={styles.contactItem}>
                {contact.url ? (
                  <Link src={contact.url} style={styles.contactLink}>
                    {contact.text}
                  </Link>
                ) : (
                  contact.text
                )}
                {index < contacts.length - 1 && ' • '}
              </Text>
            ))}
          </View>
        </View>

        {/* Professional Summary */}
        {resumeData?.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.paragraph}>{resumeData.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {resumeData?.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.paragraph}>{resumeData.skills}</Text>
          </View>
        )}

        {/* Work Experience */}
        {resumeData?.experience?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {resumeData.experience.map((exp, index) => {
              const bullets = parseDescription(exp.description);
              return (
                <View key={index} style={styles.entryItem}>
                  <Text style={styles.entryTitle}>
                    {exp.title || 'Position Title'}
                  </Text>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryOrganization}>
                      {exp.organization || exp.company || 'Company Name'}
                    </Text>
                    {(exp.startDate || exp.endDate) && (
                      <Text style={styles.entryDuration}>
                        {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : '- Present'}
                      </Text>
                    )}
                  </View>
                  {bullets.length > 0 && (
                    <View>
                      {bullets.map((bullet, idx) => (
                        <View key={idx} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {resumeData?.education?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resumeData.education.map((edu, index) => {
              const bullets = parseDescription(edu.description);
              return (
                <View key={index} style={styles.entryItem}>
                  <Text style={styles.entryTitle}>
                    {edu.title || edu.degree || 'Degree'}
                  </Text>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryOrganization}>
                      {edu.organization || edu.institution || 'Institution'}
                    </Text>
                    {(edu.startDate || edu.endDate) && (
                      <Text style={styles.entryDuration}>
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : '- Present'}
                      </Text>
                    )}
                  </View>
                  {bullets.length > 0 && (
                    <View>
                      {bullets.map((bullet, idx) => (
                        <View key={idx} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Projects */}
        {resumeData?.projects?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resumeData.projects.map((project, index) => {
              const bullets = parseDescription(project.description);
              return (
                <View key={index} style={styles.entryItem}>
                  <Text style={styles.entryTitle}>{project.title}</Text>
                  {(project.startDate || project.endDate || project.organization) && (
                    <View style={styles.entryHeader}>
                      {project.organization && (
                        <Text style={styles.entryOrganization}>
                          {project.organization}
                        </Text>
                      )}
                      {(project.startDate || project.endDate) && (
                        <Text style={styles.entryDuration}>
                          {project.startDate} {project.endDate ? `- ${project.endDate}` : '- Present'}
                        </Text>
                      )}
                    </View>
                  )}
                  {bullets.length > 0 && (
                    <View>
                      {bullets.map((bullet, idx) => (
                        <View key={idx} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
};