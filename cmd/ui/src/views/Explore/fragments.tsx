// Copyright 2023 Specter Ops, Inc.
// 
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// 
// SPDX-License-Identifier: Apache-2.0

import { Alert, Box, CircularProgress, Theme, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import isEmpty from 'lodash/isEmpty';
import React, { PropsWithChildren } from 'react';
import { NodeIcon } from 'bh-shared-ui';
import { TIER_ZERO_TAG } from 'src/constants';
import { GraphNodeTypes } from 'src/ducks/graph/types';
import { setSearchValue, startSearchSelected } from 'src/ducks/searchbar/actions';
import { PRIMARY_SEARCH, SEARCH_TYPE_EXACT } from 'src/ducks/searchbar/types';
import { useAppDispatch } from 'src/store';
import { format } from 'src/utils';

const useStyles = makeStyles((theme: Theme) => ({
    accordionRoot: {
        backgroundColor: 'inherit',
        margin: 0,
        '&.Mui-disabled': {
            backgroundColor: 'inherit',
        },
        '&.Mui-expanded': {
            margin: 0,
        },
    },
    accordionSummary: {
        padding: theme.spacing(0, 2),
        margin: theme.spacing(0, -2),
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    accordionDetails: {
        padding: theme.spacing(1, 0),
    },
    accordionCount: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        backgroundColor: '#d7dee3',
        minWidth: '3rem',
        height: '1.6rem',
        lineHeight: '1.6em',
        paddingX: '0.5rem',
        borderRadius: theme.shape.borderRadius,
    },
    title: {
        marginLeft: theme.spacing(2),
        lineHeight: '3em',
        fontSize: theme.typography.fontSize,
    },
    fieldsContainer: {
        borderRadius: theme.shape.borderRadius,
        fontSize: '0.75rem',
        '& > :nth-child(even)': {
            backgroundColor: theme.palette.grey[200],
        },
    },
    alertRoot: {
        display: 'flex',
        justifyContent: 'center',
        padding: 0,
        minWidth: '3rem',
        borderRadius: theme.shape.borderRadius,
    },
    alertIcon: {
        padding: '4px',
        margin: 0,
    },
}));

const exclusionList = [
    'gid',
    'hasspn',
    'system_tags',
    'user_tags',
    'neo4jImportId',
    'name',
    'objectid',
    'displayname',
    'service_principal_id',
    'highvalue',
];

const filterNegatedFields = (fields: EntityField[]): EntityField[] =>
    fields.filter((field: EntityField) => !exclusionList.includes(field.keyprop || ''));

export const Section: React.FC<PropsWithChildren<{ label?: string | null; className?: string }>> = ({
    label,
    className = '',
    children,
}) => {
    return (
        <div className={className}>
            {label && (
                <Typography variant='h6'>
                    <span
                        className={'link'}
                        onClick={(e) => {
                            e.preventDefault();
                        }}>
                        {label}
                    </span>
                </Typography>
            )}
            {children}
        </div>
    );
};

export const SubHeader: React.FC<{ label: string; count?: number; isLoading?: boolean; isError?: boolean }> = ({
    label,
    count,
    isLoading = false,
    isError = false,
}) => {
    const styles = useStyles();
    return (
        <Box display='flex' justifyContent='space-between' alignItems='center' width='100%'>
            <Typography variant='h6' className={styles.title}>
                {label}
            </Typography>
            {isLoading ? (
                <Box className={styles.accordionCount}>
                    <CircularProgress size={20} />
                </Box>
            ) : isError ? (
                <Alert
                    severity='error'
                    classes={{
                        root: styles.alertRoot,
                        icon: styles.alertIcon,
                    }}
                />
            ) : (
                count !== undefined && <span className={styles.accordionCount}>{count.toLocaleString()}</span>
            )}
        </Box>
    );
};

export const FieldsContainer: React.FC<PropsWithChildren> = ({ children }) => {
    const styles = useStyles();
    return <div className={styles.fieldsContainer}>{children}</div>;
};

export const Field: React.FC<EntityField> = ({ label, value, keyprop }) => {
    if (value === undefined || value === '' || (typeof value === 'object' && isEmpty(value))) return null;
    const formattedValue = format(value);

    let content: React.ReactNode;
    if (typeof formattedValue === 'string') {
        content = (
            <Box display='flex' flexDirection='row' flexWrap='wrap' padding={1}>
                <Box flexShrink={0} flexGrow={1} fontWeight='bold' mr={1}>
                    {label}
                </Box>
                <Box overflow='hidden' textOverflow='ellipsis' title={formattedValue}>
                    {formattedValue}
                </Box>
            </Box>
        );
    } else {
        content = formattedValue!.map((value: string, index: number) => {
            return (
                <Box
                    display='flex'
                    flexDirection='row'
                    flexWrap='wrap'
                    padding={1}
                    justifyContent='flex-end'
                    key={`${keyprop}-${index}`}>
                    {index === 0 && (
                        <Box flexShrink={0} flexGrow={1} fontWeight='bold' mr={1}>
                            {label}
                        </Box>
                    )}
                    <Box overflow='hidden' textOverflow='ellipsis' title={value}>
                        {value}
                    </Box>
                </Box>
            );
        });
    }

    return <>{content}</>;
};

interface BasicObjectInfoFieldsProps {
    objectid: string;
    displayname?: string;
    system_tags?: string;
    service_principal_id?: string;
    noderesourcegroupid?: string;
    name?: string;
}

export const BasicObjectInfoFields: React.FC<BasicObjectInfoFieldsProps> = (props): JSX.Element => {
    const dispatch = useAppDispatch();
    return (
        <>
            {props.system_tags?.includes(TIER_ZERO_TAG) && <Field label='Tier Zero:' value={true} />}
            {props.displayname && <Field label='Display Name:' value={props.displayname} />}
            <Field label='Object ID:' value={props.objectid} />
            <>
                {props.service_principal_id && (
                    <Box padding={1}>
                        <Box fontWeight='bold' mr={1}>
                            Service Principal ID:
                        </Box>
                        <br />
                        <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start'>
                            <NodeIcon nodeType={GraphNodeTypes.AZServicePrincipal} />
                            <Box
                                data-testid='explore_entity-information-panel-service-principal-id'
                                onClick={() => {
                                    dispatch(
                                        setSearchValue(
                                            {
                                                objectid: props.service_principal_id!,
                                                label: '',
                                                type: GraphNodeTypes.AZServicePrincipal,
                                                name: props.name || '',
                                            },
                                            PRIMARY_SEARCH,
                                            SEARCH_TYPE_EXACT
                                        )
                                    );
                                    dispatch(startSearchSelected(PRIMARY_SEARCH));
                                }}
                                style={{ cursor: 'pointer' }}
                                overflow='hidden'
                                textOverflow='ellipsis'
                                title={props.service_principal_id}>
                                {props.service_principal_id}
                            </Box>
                        </Box>
                    </Box>
                )}
            </>
            <>
                {props.noderesourcegroupid && (
                    <Box padding={1}>
                        <Box fontWeight='bold' mr={1}>
                            Node Resource Group ID:
                        </Box>
                        <br />
                        <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start'>
                            <NodeIcon nodeType={GraphNodeTypes.AZResourceGroup} />
                            <Box
                                data-testid='explore_entity-information-panel-node-resource-group-id'
                                onClick={() => {
                                    dispatch(
                                        setSearchValue(
                                            {
                                                objectid: props.noderesourcegroupid!,
                                                label: '',
                                                type: GraphNodeTypes.AZResourceGroup,
                                                name: props.name || '',
                                            },
                                            PRIMARY_SEARCH,
                                            SEARCH_TYPE_EXACT
                                        )
                                    );
                                    dispatch(startSearchSelected(PRIMARY_SEARCH));
                                }}
                                style={{ cursor: 'pointer' }}
                                overflow='hidden'
                                textOverflow='ellipsis'
                                title={props.noderesourcegroupid}>
                                {props.noderesourcegroupid}
                            </Box>
                        </Box>
                    </Box>
                )}
            </>
        </>
    );
};

export type EntityField = {
    label: string;
    value: string | number | boolean | undefined | string[];
    keyprop?: string;
};

export const ObjectInfoFields: React.FC<{ fields: EntityField[] }> = ({ fields }): JSX.Element => {
    const filteredFields = filterNegatedFields(fields);

    return (
        <>
            {filteredFields.map((field: EntityField) => {
                return (
                    <Field
                        label={field.label}
                        value={field.value}
                        key={`${field.keyprop}-${field.label}`}
                        keyprop={`${field.keyprop}-${field.label}`}
                    />
                );
            })}
        </>
    );
};