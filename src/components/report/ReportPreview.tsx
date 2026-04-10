import type { Report, Page } from '@/types/report';

interface ReportPreviewProps {
  report: Report;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const dateStr = new Date(report.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const physicalPages: { 
    pageData: Page; 
    images: any[]; 
    table: any; 
    isFirstSubPage: boolean; 
    logicalPageIdx: number;
    subPageIdx: number;
  }[] = [];

  report.pages.forEach((page, pIdx) => {
    const images = page.images || [];
    const hasTable = page.table && page.table.enabled;
    
    const imageChunks: any[][] = [];
    for (let i = 0; i < images.length; i += 2) {
      imageChunks.push(images.slice(i, i + 2));
    }

    if (imageChunks.length === 0 && !hasTable) {
      physicalPages.push({ 
        pageData: page, 
        images: [], 
        table: null, 
        isFirstSubPage: true, 
        logicalPageIdx: pIdx,
        subPageIdx: 0
      });
    } else {
      imageChunks.forEach((chunk, cIdx) => {
        physicalPages.push({
          pageData: page,
          images: chunk,
          table: null, 
          isFirstSubPage: cIdx === 0,
          logicalPageIdx: pIdx,
          subPageIdx: cIdx
        });
      });

      if (hasTable) {
        physicalPages.push({
          pageData: page,
          images: [],
          table: page.table,
          isFirstSubPage: imageChunks.length === 0,
          logicalPageIdx: pIdx,
          subPageIdx: imageChunks.length
        });
      }
    }
  });

  const pageHeight = '209.5mm'; // Slightly less than 210mm to prevent rounding-induced page breaks
  const mainContainerStyle: React.CSSProperties = {
    width: '297mm',
    height: pageHeight,
    padding: '7mm', // Tightened slightly more
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    margin: 0,
  };

  const innerBorderStyle: React.CSSProperties = {
    border: '3pt solid black',
    padding: '5mm 10mm',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const headerLabelStyle: React.CSSProperties = {
    fontSize: '9pt',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#1a365d',
    marginBottom: '1mm',
  };

  return (
    <div 
      id="report-preview" 
      style={{ 
        backgroundColor: '#fff', 
        margin: 0, 
        padding: 0, 
        width: '297mm',
        height: `${physicalPages.length * 209.5}mm`,
        overflow: 'hidden',
        display: 'block'
      }}
    >
      {physicalPages.map((physPage, physIdx) => (
        <div
          key={`${physPage.pageData.id}-${physPage.subPageIdx}`}
          className="report-page bg-white mx-auto"
          style={{
            ...mainContainerStyle,
            pageBreakAfter: physIdx < physicalPages.length - 1 ? 'always' : 'auto',
          }}
        >
          <div style={innerBorderStyle}>
            {/* Top Date */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5mm' }}>
              <div style={{ ...headerLabelStyle, marginBottom: 0 }}>
                DATE: {dateStr}
              </div>
            </div>

            {/* Main Header - Only on the very first physical page */}
            {physIdx === 0 && (
              <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
                <h1 style={{
                  fontSize: '22pt',
                  fontWeight: 1000,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#1a365d',
                  margin: '0 0 1mm 0',
                  lineHeight: 1,
                }}>
                  {report.companyName || 'COMPANY NAME'}
                </h1>
                <div style={{
                  height: '2pt',
                  backgroundColor: 'black',
                  width: '100%',
                  margin: '2mm 0 3mm 0',
                }} />
                <h2 style={{
                  fontSize: '15pt',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}>
                  {report.name || 'INSPECTION REPORT'}
                </h2>
              </div>
            )}

            {/* Continuation Header for subsequent pages */}
            {physIdx > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4mm',
                marginBottom: '4mm',
              }}>
                <div style={{
                  backgroundColor: '#1a365d',
                  color: 'white',
                  padding: '1mm 3mm',
                  fontWeight: 900,
                  fontSize: '8.5pt',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  border: '1.5pt solid black',
                  boxShadow: '2px 2px 0px rgba(0,0,0,1)',
                }}>
                  {report.name} (CONT.)
                </div>
                <div style={{ flex: 1, height: '1.5pt', backgroundColor: 'black' }} />
                <div style={{ fontWeight: 800, fontSize: '8pt', color: '#666' }}>
                  PAGE {physIdx + 1}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {/* Page Title */}
              {physPage.isFirstSubPage && physPage.pageData.title && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '3mm' }}>
                  <div style={{
                    backgroundColor: '#f1f5f9',
                    border: '1.5pt solid black',
                    padding: '1mm 3mm',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '9.5pt',
                    letterSpacing: '0.05em',
                  }}>
                    {physPage.pageData.title}
                  </div>
                  <div style={{ flex: 1, height: '1pt', backgroundColor: '#e2e8f0' }} />
                </div>
              )}

              {/* Continuation marker */}
              {!physPage.isFirstSubPage && (
                <div style={{ marginBottom: '3mm', display: 'flex', alignItems: 'center', gap: '2mm' }}>
                  <span style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                    {physPage.pageData.title || 'Section'} (continued)
                  </span>
                  <div style={{ flex: 1, height: '1pt', borderTop: '1px dashed #e2e8f0' }} />
                </div>
              )}

              {/* Images Grid (Max 2) */}
              {physPage.images.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '5mm',
                  marginBottom: '3mm',
                }}>
                  {physPage.images.map(img => (
                    <div key={img.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{
                        border: '1.5pt solid black',
                        backgroundColor: '#f8fafc',
                        padding: '3pt',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        height: '92mm',
                      }}>
                        <img
                          src={img.url}
                          alt={img.caption || 'Report image'}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            border: '1px solid #eee',
                          }}
                        />
                      </div>
                      {img.caption && (
                        <div style={{
                          marginTop: '1mm',
                          padding: '1mm 2mm',
                          backgroundColor: '#1a365d',
                          color: 'white',
                          fontSize: '8.5pt',
                          fontWeight: 700,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          border: '1.5pt solid black',
                          borderTop: 'none',
                        }}>
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Table Section */}
              {physPage.table && (
                <div style={{ marginTop: '1mm' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '2pt solid black',
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1a365d', color: 'white' }}>
                        {physPage.table.columns.map((col: string, ci: number) => (
                          <th key={ci} style={{
                            border: '1.2pt solid black',
                            padding: '3mm 2mm',
                            fontSize: '9pt',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            textAlign: 'center',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {physPage.table.rows.map((row: string[], ri: number) => (
                        <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{
                              border: '0.8pt solid black',
                              padding: '2.5mm 3mm',
                              fontSize: '9.5pt',
                              textAlign: 'center',
                              fontWeight: ci === 0 ? 800 : 500,
                            }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer / Signature Area */}
            {physIdx === physicalPages.length - 1 && (
              <div style={{ marginTop: 'auto', paddingTop: '3mm' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '7pt', color: '#64748b', fontStyle: 'italic', maxWidth: '140mm' }}>
                    * Official document generated via Report Builder Pro.
                    All measurements recorded at the time of inspection.
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 900,
                      fontSize: '9pt',
                      textTransform: 'uppercase',
                      color: '#1a365d',
                      borderBottom: '1pt solid black',
                      paddingBottom: '1mm',
                      marginBottom: '1mm',
                      width: '50mm',
                      textAlign: 'center',
                    }}>
                      {report.companyName}
                    </div>
                    <div style={{ fontSize: '7.5pt', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Absolute Page Number */}
            <div style={{
              position: 'absolute',
              bottom: '2.5mm',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '7pt',
              fontWeight: 700,
              color: '#94a3b8',
            }}>
              PAGE {physIdx + 1} OF {physicalPages.length}
            </div>
          </div>
        </div>
      ))}

      {physicalPages.length === 0 && (
        <div style={{ ...mainContainerStyle, margin: '0 auto' }}>
          <div style={{ ...innerBorderStyle, alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: '14pt' }}>No content available</p>
          </div>
        </div>
      )}
    </div>
  );
}
