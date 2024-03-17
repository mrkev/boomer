import React, { useEffect, useRef } from "react";
import Editor, { BeforeMount, OnChange, OnMount } from "@monaco-editor/react";
import { EngineObject } from "../engine/EngineObject";
import { editor } from "monaco-editor";

export function CodeEditor({
  engineObject: eo,
}: {
  engineObject: EngineObject;
}) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.setValue(eo._script);
  }, [eo._script]);

  const handleEditorWillMount: BeforeMount = function (monaco) {
    console.log("AAAAAAa");

    monaco.editor.create;
    const compilerOptions = Object.assign(
      {},
      monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
      {
        lib: ["es6"],
      }
    );

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      compilerOptions
    );

    // monaco.languages.typescript.javascriptDefaults.setCompilerOptions({})
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `
    /** the frame */
    declare const frame: {width: number, height: number};

    declare const me: {todo: number}
    `,
      "frame.d.ts"
    );
  };

  const handleEditorDidMount: OnMount = function (editor) {
    // here is the editor instance
    // you can store it in `useRef` for further usage
    editorRef.current = editor;
  };

  const handleEditorChange: OnChange = (value) => {
    eo._script = value || "";
  };

  return (
    <Editor
      options={{ minimap: { enabled: false }, tabSize: 2, insertSpaces: true }}
      width="100%"
      theme="vs-dark"
      height="100%"
      defaultLanguage="javascript"
      defaultValue={eo._script}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
}
