import React from "react";

interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  return (
    <div className="space-y-4">
      <form action="/upload" method="post" encType="multipart/form-data">
        <input
          type="file"
          multiple
          onChange={onFileChange}
          className="border p-2"
          name="files"
          title=""
        />
      </form>
    </div>
  );
};

export default FileUpload;
