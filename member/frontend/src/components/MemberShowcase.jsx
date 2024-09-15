import React from 'react';
import { Card, CardContent, Avatar, Typography, Grow } from '@mui/material';
import Grid from '@mui/material/Grid';

const MemberShowcase = ({ members }) => {
  return (
    <Grid container spacing={3}>
      {members.map((member, index) => (
        <Grow in key={member.id} timeout={(index + 1) * 300}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Avatar alt={member.username} src={member.avatar} />
                <Typography variant="h6">{member.username}</Typography>
                {/* Optionally include email here if not null */}
                {member.email && <Typography variant="body2">{member.email}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grow>
      ))}
    </Grid>
  );
};

export default MemberShowcase;
