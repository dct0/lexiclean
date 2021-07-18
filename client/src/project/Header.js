import React, { useState, useEffect } from "react";
import axios from "../common/utils/api-interceptor";
import { createUseStyles } from "react-jss";
import {
  Container,
  Row,
  Col,
  Spinner,
  InputGroup,
  FormControl,
  Button,
} from "react-bootstrap";
import { MdSave } from "react-icons/md";

import NavBar from "../common/components/navbar";

const useStyles = createUseStyles({
  header: {
    maxWidth: "100%",
    width: "100vw!important",
    position: "sticky",
    top: "0",
  },
  metricsContainer: {
    display: "inline-block",
    backgroundColor: "#A2D2D2",
    margin: "auto",
    padding: "0.2em 0.5em 0em 0.5em",
    borderRadius: "0.5em",
  },
  menu: {
    marginRight: "1em",
    padding: "0.25em",
    display: "flex",
  },
  save: {
    marginLeft: "0.25em",
    fontSize: "36px",
    color: "grey",
    cursor: "pointer",
  },
});

export default function Header({
  project,
  currentTexts,
  setShowDownload,
  setShowProgress,
  setShowSettings,
  setShowOverview,
  setShowLegend,
  setShowModifySchema,
  setShowHelp,
  pageChanged,
  saveTrigger,
  setSaveTrigger,
  savePending,
  setSavePending,
  searchTerm,
  setSearchTerm,
}) {
  const classes = useStyles();

  const username = localStorage.getItem("username");

  const [progress, setProgress] = useState();
  const [currentVocabSize, setCurrentVocabSize] = useState();
  const [currentOOVTokenCount, setCurrentOOVTokenCount] = useState();

  const [tempValue, setTempValue] = useState(searchTerm);

  useEffect(() => {
    const fetchProgressInfo = async () => {
      // console.log('fetching progress data')
      if (project._id) {
        const response = await axios.get(`/api/project/counts/${project._id}`);
        if (response.status === 200) {
          setProgress(response.data.text);
          setCurrentVocabSize(response.data.token.vocab_size);
          setCurrentOOVTokenCount(response.data.token.oov_tokens);
        }
      }
    };
    fetchProgressInfo();
  }, [project, pageChanged, saveTrigger]);

  const savePageResults = async () => {
    if (project._id) {
      const response = await axios.patch(
        `/api/token/suggest/accept/${project._id}`,
        { textIds: currentTexts.map((text) => text._id) }
      );
      if (response.status === 200) {
        setSavePending(false);
        setSaveTrigger(!saveTrigger);
      }
    }
  };

  const navbarProps = {
    project,
    setShowLegend,
    setShowDownload,
    setShowModifySchema,
    setShowSettings,
    setShowHelp,
    username,
  };

  return (
    <>
      <Container className={classes.header}>
        <NavBar {...navbarProps} />

        <Row style={{ backgroundColor: "white", opacity: "0.9" }}>
          {progress && project && currentVocabSize ? (
            <>
              <Col md="1" className="text-left" style={{ marginTop: "0.5em" }}>
                {progress && project && currentVocabSize ? (
                  <p
                    className={classes.save}
                    onClick={() => savePageResults()}
                    title="Click to save the current pages suggestions"
                  >
                    <MdSave
                      style={{ color: savePending ? "rgb(107, 176, 191)" : "" }}
                    />
                  </p>
                ) : null}
              </Col>
              <Col md="3" className="text-center">
                <Row
                  style={{
                    marginTop: "0.5em",
                    backgroundColor: "white",
                    opacity: "1",
                  }}
                >
                  <InputGroup
                    style={{
                      margin: "1em 0em 0em 0em",
                      width: "100%",
                      mixWidth: "300px",
                      maxWidth: "500px",
                      height: "2em",
                      padding: "0em",
                    }}
                  >
                    <FormControl
                      placeholder="Enter term to filter"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                    />
                    <InputGroup.Append>
                      <Button
                        variant="dark"
                        disabled={tempValue === ""}
                        onClick={() => setSearchTerm(tempValue)}
                      >
                        Search
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={() => {
                          setSearchTerm("");
                          setTempValue("");
                        }}
                      >
                        Clear
                      </Button>
                    </InputGroup.Append>
                  </InputGroup>
                </Row>
              </Col>
              <Col md="8" className="text-center">
                <Row
                  style={{
                    marginTop: "0.5em",
                    backgroundColor: "white",
                    opacity: "1",
                  }}
                >
                  <Col>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "0em",
                        width: "100%",
                      }}
                    >
                      <p
                        style={{
                          margin: "0em",
                          fontSize: "1.5em",
                          fontWeight: "bolder",
                        }}
                      >
                        {progress.annotated} / {progress.total}
                      </p>
                      <p
                        style={{ fontSize: "0.75em", fontWeight: "bold" }}
                        title="Texts that have had classifications or replacements."
                      >
                        Texts Annotated
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "0em",
                        width: "100%",
                      }}
                    >
                      <p
                        style={{
                          margin: "0em",
                          fontSize: "1.5em",
                          fontWeight: "bolder",
                        }}
                      >
                        {currentVocabSize} /{" "}
                        {project.metrics.starting_vocab_size}
                      </p>
                      <p
                        style={{ fontSize: "0.75em", fontWeight: "bold" }}
                        title="Comparison between of current vocabulary and starting vocabulary"
                      >
                        Current Vocab / Starting Vocab
                      </p>
                    </div>
                  </Col>
                  <Col>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "0em",
                        width: "100%",
                      }}
                    >
                      <p
                        style={{
                          margin: "0em",
                          fontSize: "1.5em",
                          fontWeight: "bolder",
                        }}
                      >
                        {project.metrics.starting_oov_token_count -
                          currentOOVTokenCount}{" "}
                        / {project.metrics.starting_oov_token_count}
                      </p>
                      <p
                        style={{ fontSize: "0.75em", fontWeight: "bold" }}
                        title="All tokens replaced or classified with meta-tags are captured"
                      >
                        OOV Corrected
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
            </>
          ) : (
            <Col md="8" className="text-center">
              <Spinner animation="border" size="sm" variant="light" />
            </Col>
          )}
        </Row>
      </Container>
    </>
  );
}
