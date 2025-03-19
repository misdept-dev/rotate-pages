"use client";

import React, { useState } from "react";
import shortid from "shortid";
import { PDFDocument, degrees } from 'pdf-lib';

interface FileData {
  id: string;
  filename: string;
  filetype: string;
  filepfd: string | ArrayBuffer | null;
  datetime: string;
  filesize: string;
  roteval: string;
  file: File;
}

const pageSizes = {
  a4: {
      width: 594.96,
      height: 841.92,
  },
  letter: {
      width: 612,
      height: 792,
  },
};

interface RotationData {
  value: string;
}


const FileUpload: React.FC = () => {
  const [selectedfile, SetSelectedFile] = useState<FileData[]>([]);
  const [Files, SetFiles] = useState<FileData[]>([]);
  const [Value] = useState<RotationData>({ value: '90' });
  
  const filesizes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const InputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          SetSelectedFile((preValue) => {
            return [
              ...preValue,
              {
                id: shortid.generate(),
                filename: file.name,
                filetype: file.type,
                file: file,
                filepfd: reader.result,
                roteval: Value.value,
                datetime: new Date(file.lastModified).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
                filesize: filesizes(file.size)
              }
            ];
          });
        };
        if (file) {
          reader.readAsDataURL(file);
        }
      }
    }
  };
  const FileUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // form reset on submit 
      (e.target as HTMLFormElement).reset();
      if (selectedfile.length > 0) {
          for (let index = 0; index < selectedfile.length; index++) {
              const pfdFile = selectedfile[index].file;
              const pdfDoc = await PDFDocument.load(await pfdFile.arrayBuffer(), { ignoreEncryption: true });
              const pages = pdfDoc.getPages()
              const new_size = pageSizes['a4'];
              const new_size_ratio = Math.round((new_size.width / new_size.height) * 100);
              pages.forEach(page => {
                const { width, height } = page.getMediaBox();
                const size_ratio = Math.round((width / height) * 100);
                // If ratio of original and new format are too different we can not simply scale (more that 1%)
                if (Math.abs(new_size_ratio - size_ratio) > 1) {
                    // Change page size
                    page.setSize(new_size.width, new_size.height);
                    const scale_content = Math.min(new_size.width / width, new_size.height / height);
                    // Scale content
                    page.scaleContent(scale_content, scale_content);
                    const scaled_diff = {
                        width: Math.round(new_size.width - scale_content * width),
                        height: Math.round(new_size.height - scale_content * height),
                    };
                    // Center content in new page format
                    page.translateContent(Math.round(scaled_diff.width / 2), Math.round(scaled_diff.height / 2));
                } else {
                    page.scale(new_size.width / width, new_size.height / height);
                }
                const setRota = parseInt(selectedfile[index].roteval, 10);
                page.setRotation(degrees(setRota));
              });
              const pdfBytes = await pdfDoc.save();
              const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
              const fileReader = new FileReader();
              fileReader.onload = function() {
                fileReader.readAsDataURL(blob);
              }
              const b64 = Buffer.from(pdfBytes).toString('base64');
              const dataUrl = "data:application/pdf;base64," + b64;
              selectedfile[index].filepfd = dataUrl;
              SetFiles((preValue)=>{
                  return[
                      ...preValue,
                      selectedfile[index]
                  ]   
              })
          }
          SetSelectedFile([]);
      } else {
          alert('Please select file')
      }
  };

  // const DeleteFile = async (id) => {
  //   if(window.confirm("Are you sure you want to delete this file?")){
  //       const result = Files.filter((data)=>data.id !== id);
  //     (result);
  //   }else{
  //       // alert('No');
  //   }
  // }

  const DeleteSelectFile = (id: string) => {
    if(window.confirm("Are you sure you want to delete this file?")){
        const result = selectedfile.filter((data) => data.id !== id);
        SetSelectedFile(result);
    }else{
        // alert('No');
    }
    
  }
  return (
    <div className="row justify-content-center m-0">
      <div className="fileupload-view">
        <div className="row justify-content-center m-0">
          <div className="col-md-6">
            <div className="card mt-5">
              <div className="card-body">
                <div className="kb-data-box">
                  <div className="kb-modal-data-title">
                    <div className="kb-data-title">
                      <h6>Multiple File Upload</h6>
                    </div>
                  </div>
                  <form onSubmit={FileUploadSubmit}>
                    <div className="kb-file-upload">
                      <div className="file-upload-box">
                        <input
                          type="file"
                          id="fileupload"
                          className="file-upload-input"
                          onChange={InputChange}
                          multiple
                        />
                        <span>
                          Drag and drop or{" "}
                          <span className="file-link">Choose your files</span>
                        </span>
                      </div>
                    </div>
                    <div className="kb-attach-box mb-3">
                      {selectedfile.map((data) => {
                      const { id, filename, filepfd, datetime, filesize } = data;
                      return (
                        <div className="file-atc-box" key={id}>
                        {filename.match(/.(jpg|jpeg|png|gif|svg)$/i) ? (
                          <div className="file-image">
                          <img src={typeof filepfd === 'string' ? filepfd : undefined} alt={filename} />
                          </div>
                        ) : (
                          <div className="file-image">
                          <i className="far fa-file-alt"></i>
                          </div>
                        )}
                        <div className="file-detail">
                          <h6>{filename}</h6>
                          <p></p>
                          <p>
                          <span>Size : {filesize}</span>
                          <span className="ml-2">Modified Time : {datetime}</span>
                          </p>
                          <div className="file-actions">
                          <button
                            type="button"
                            className="file-action-btn"
                            onClick={() => DeleteSelectFile(id)}
                          >
                            Delete
                          </button>
                          <select
                            className="file-action-select"
                            defaultValue="90"
                            onChange={(e) => {
                              SetSelectedFile((prevFiles) =>
                                prevFiles.map((file) =>
                                  file.id === id ? { ...file, roteval: e.target.value } : file
                                )
                              )
                            }}
                          >
                            <option value="90">90°</option>
                            <option value="180">180°</option>
                            <option value="270">270°</option>
                            <option value="-90">-90°</option>
                            <option value="0">0°</option>
                          </select>
                          </div>
                        </div>
                        </div>
                      );
                      })}
                    </div>
                    <div className="kb-buttons-box">
                      <button
                        type="submit"
                        className="btn btn-primary form-submit"
                      >
                        Upload
                      </button>
                    </div>
                  </form>
                  {Files.length > 0 ? <div className="kb-attach-box">
                    <hr />
                    {Files.map((data, index) => {
                      const { filename, filepfd, datetime, filesize } = data;
                      return (
                              <div className="file-atc-box" key={index}>
                          {filename.match(/.(jpg|jpeg|png|gif|svg)$/i) ? (
                              <div className="file-image">
                                  <img src={typeof filepfd === 'string' ? filepfd : undefined} alt="" />
                              </div>
                          ) : (
                              <div className="file-image">
                                  <i className="far fa-file-alt"></i>
                              </div>
                          )}
                          <div className="file-detail">
                              <h6>{filename}</h6>
                              <p>
                                  <span>Size : {filesize}</span>
                                  <span className="ml-3">Modified Time : {datetime}</span>
                              </p>
                              <div className="file-actions">
                                  <a href={typeof filepfd === 'string' ? filepfd : undefined} className="file-action-btn" download={filename}>
                                      Download
                                  </a>
                              </div>
                          </div>
                      </div>
                      );
                    })}
                  </div> : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FileUpload;
