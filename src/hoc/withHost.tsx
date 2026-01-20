import { useState, useEffect, useRef } from "react";
import { Script } from "../components/Script";
import type { IHostData } from "../types";

export interface WrappedComponentProps {
  incomingData?: {
    [key: string]: {
      data: {
        outputs: { output: unknown }[]; // Array of objects with an `output` property
      };
      source: string;
    };
  };
  hostData?: IHostData;
  sendOutput?: (outputHandlerId: string, payload: Record<string, unknown>) => void;
}

// Higher Order Component
export function withHost<P extends WrappedComponentProps>(WrappedComponent: React.FC<P>) {
  return function WithHost(props: P) {
    const blockSdkInstance = useRef<{ sendOutput: (id: string, data: Record<string, unknown>) => void }>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const [incomingData, setIncomingData] = useState<{
      [key: string]: { data: Record<string, unknown>; source: string };
    }>({});
    const [hostData, setHostData] = useState<IHostData>({} as IHostData);

    const onIncomingData = (_event: unknown, data: { targetHandleId: string; payload: { data: Record<string, unknown> }; source: string }) => {
      const targetHandleId = data.targetHandleId;
      setIncomingData((incomingData) => ({
        ...incomingData,
        [targetHandleId]: { data: data.payload.data, source: data.source },
      }));
    };

    const onHostDataUpdate = (event: { receivingBlockId: string }, hostData: Partial<IHostData>) => {
      setHostData((data) => {
        const newData = {
          blockId: event.receivingBlockId,
          ...data,
          ...hostData,
        };
        return newData;
      });
    };

    const sendOutput = (outputHandlerId: string, data: Record<string, unknown>) => {
      blockSdkInstance.current?.sendOutput(outputHandlerId, data);
    };

    const onBlockSdkLoad = () => {
      console.log("BlockSdk loaded");
      const windowWithBlockSdk = window as unknown as {
        BlockSdk?: {
          register: (config: {
            onIncomingData: typeof onIncomingData;
            onHostDataUpdate: typeof onHostDataUpdate;
          }) => Promise<typeof blockSdkInstance.current>;
        };
      };

      if (windowWithBlockSdk.BlockSdk) {
        (async () => {
          try {
            const blockSdk = await windowWithBlockSdk.BlockSdk!.register({
              onIncomingData: onIncomingData,
              onHostDataUpdate: onHostDataUpdate,
            });
            blockSdkInstance.current = blockSdk;
          } catch (error) {
            console.error("Error registering BlockSdk:", error);
          }
        })();
      }
    };

    useEffect(() => {
      if (hostData.incomingEdges?.length === 0) {
        setIncomingData({});
      }
    }, [hostData]);

    return (
      <div ref={widgetRef}>
        <Script
          src="https://unpkg.com/@psnext/block-sdk@0.0.27/dist/block-sdk.js"
          onLoad={onBlockSdkLoad}
        />
        <WrappedComponent
          {...(props as P)}
          incomingData={incomingData}
          hostData={hostData}
          sendOutput={sendOutput}
        />
      </div>
    );
  };
}
