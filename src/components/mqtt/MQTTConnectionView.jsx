import React from "react";
import { Box, Grid, GridItem, VStack } from "@chakra-ui/react";
import { PublishWorkspace } from "./PublishWorkspace";
import { TelemetryPanel } from "./TelemetryPanel";
import { MessageLogTable } from "./MessageLogTable";

export const MQTTConnectionView = ({ state, dispatch, handlePublish }) => {
  return (
    <VStack align="stretch" spacing={6} h="full">
      <Grid templateColumns={{ base: "1fr", xl: "1fr 400px" }} gap={6} flex={1}>
        <GridItem>
          <Box h="full" bg="white" borderRadius="12px" border="1px solid #E2E8F0" overflow="hidden">
            <PublishWorkspace state={state} dispatch={dispatch} onPublish={handlePublish} />
          </Box>
        </GridItem>
        <GridItem>
          <Box h="full" bg="white" borderRadius="12px" border="1px solid #E2E8F0" overflow="hidden">
            <TelemetryPanel state={state} />
          </Box>
        </GridItem>
      </Grid>
      
      <Box h="300px" bg="white" borderRadius="12px" border="1px solid #E2E8F0" overflow="hidden">
        <MessageLogTable state={state} dispatch={dispatch} />
      </Box>
    </VStack>
  );
};
